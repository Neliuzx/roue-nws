const http = require('http')
const fs = require('fs')
const path = require('path')
const db = require('./db/db')

const PUBLIC_DIR = path.join(__dirname, 'public')
const PORT = 3000
const DELAI = 24 * 60 * 60 * 1000

const lots = [
  "Perdu",
  "1 café offert",
  "1 lot bleu",
  "1 café offert",
  "Perdu",
  "1 café offert",
  "1 lot bleu",
  "1 café offert"
]

const MAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/


const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}


function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > 1e4) req.destroy()
    })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function serveStatic(req, res) {
  let url
  try {
    url = decodeURIComponent(req.url.split('?')[0])
  } catch {
    res.writeHead(400)
    return res.end('Requête invalide')
  }

  const filePath = path.join(PUBLIC_DIR, url === '/' ? 'index.html' : url)

  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403)
    return res.end('Interdit')
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404)
      return res.end('Introuvable')
    }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
    res.writeHead(200, { 'Content-Type': type })
    res.end(content)
  })
}


function tempsRestant(ms) {
  const totalMin = Math.ceil(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${m} min`
}

async function jouer(req, res) {
  let mail
  try {
    const body = JSON.parse(await readBody(req))
    mail = String(body.mail || '').trim().toLowerCase()
  } catch {
    return sendJson(res, 400, { erreur: "Requête invalide." })
  }

  if (!MAIL_REGEX.test(mail)) {
    return sendJson(res, 400, { erreur: "Adresse e-mail invalide." })
  }

  const derniere = db.getLastByMail(mail)
  if (derniere) {
    const reste = new Date(derniere.date).getTime() + DELAI - Date.now()
    if (reste > 0) {
      return sendJson(res, 429, { erreur: `Vous avez déjà joué. Revenez dans ${tempsRestant(reste)}.` })
    }
  }

  const [local, domaine] = mail.split('@')
  if (domaine !== 'normandiewebschool.fr' || local.includes('+')) {
    return sendJson(res, 400, { erreur: "Adresse e-mail invalide." })
  }

  const index = Math.floor(Math.random() * lots.length)
  db.add({ mail, lot: lots[index], date: new Date().toISOString() })

  sendJson(res, 200, { index, lot: lots[index] })
}

async function adminLogin(req, res) {
  let username, password
  try {
    const body = JSON.parse(await readBody(req))
    username = String(body.username || '')
    password = String(body.password || '')
  } catch {
    return sendJson(res, 400, { erreur: "Requête invalide." })
  }

  if (!db.checkAdmin(username, password)) {
    return sendJson(res, 401, { erreur: "Identifiants incorrects." })
  }

  sendJson(res, 200, { ok: true })
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0]

  if (req.method === 'POST' && pathname === '/api/jouer') {
    return jouer(req, res)
  }
  if (req.method === 'POST' && pathname === '/api/admin/login') {
    return adminLogin(req, res)
  }
  if (req.method === 'GET' && pathname === '/api/admin/participations') {
    return sendJson(res, 200, db.getAll())
  }
  if (req.method === 'GET' && pathname === '/api/gagnants') {
    return sendJson(res, 200, db.getLastWin())
  }
  if (req.method === 'GET') {
    return serveStatic(req, res)
  }
  res.writeHead(405)
  res.end('Méthode non autorisée')
})

server.listen(PORT, () => console.log(`http://localhost:${PORT}`))


//faire des inscriptions pendant les evenements 
//lien d'invitations par étudiant avec limite de 5 personnes
//faire l'environnement pour les events
//solution possible: faire en sorte que les personnes ne puissent jouer uniquement sur place avec un mail créer spécifiquement pour l'event
//envoyer un code unique par mail qui sera l'id de chaque étudiant (permanent) et un code d'evenements ou les gens joueront sur place
//brevo
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
  const url = decodeURIComponent(req.url.split('?')[0])
  const filePath = path.join(PUBLIC_DIR, url === '/' ? 'index.html' : url)

  if (!filePath.startsWith(PUBLIC_DIR)) {
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

function lastWin(){
    console.log(db.getLastWin())
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

  if (mail.split('@')[1].toLowerCase() !== 'normandiewebschool.fr') {
      return sendJson(res, 400, { erreur: "Adresse e-mail invalide." })
  }
  if (mail.split('@')[0].toLowerCase().includes('+')) {
      return sendJson(res, 400, { erreur: "Adresse e-mail invalide." })
  }
  const index = Math.floor(Math.random() * lots.length)
  db.add({ mail, lot: lots[index], date: new Date().toISOString() })

  sendJson(res, 200, { index, lot: lots[index] })
}



const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/api/jouer') {
    return jouer(req, res)
  }
  if (req.method === 'GET' && req.url === '/api/gagnants') {
    return sendJson(res, 200, db.getLastWin())
  }
  if (req.method === 'GET') {
    return serveStatic(req, res)
  }
  res.writeHead(405)
  res.end('Méthode non autorisée')
})

server.listen(PORT, () => console.log(`http://localhost:${PORT}`))
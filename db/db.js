const fs = require('fs')
const path = require('path')

const dbpath = path.join(__dirname, 'db.json')

function read(){
    if(!fs.existsSync(dbpath)) fs.writeFileSync(dbpath, '[]')
    return JSON.parse(fs.readFileSync(dbpath, 'utf-8'))
}

function write(data) {
  const tmp = dbpath + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, dbpath)
}

function add(item){
    const data = read()
    const newItem = { date: Date.now(), ...item }
    data.push(newItem)
    write(data)
    return newItem
}

function getAll() {
  return read()
}

function getLastByMail(mail) {
  const entries = read().filter(item => item.mail === mail)
  return entries[entries.length - 1]
}


function getLastWin() {
    const entries = read().filter(item => item.lot !== "Perdu")
    entries.sort((a, b) => b.date.localeCompare(a.date))

    return entries.slice(0, 10).map(item => {
        const [nom, domaine] = item.mail.split('@')
        const mailMasque = nom.slice(0, 2) + '*'.repeat(5) + '@' + domaine

        return {
            mail: mailMasque,
            lot: item.lot,
            date: item.date
        }
    })
}


function remove(id) {
  const data = read()
  const filtered = data.filter(item => item.id !== id)
  if (filtered.length === data.length) return false
  write(filtered)
  return true
}

module.exports = { add, getLastWin, getAll, getLastByMail, remove }
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const admins = createDb('admins')

function checkAdmin(username, password) {
    return !!admins.findOne(a => a.username === username && a.password === password)
}

function createDb(nom) {
    const dbpath = path.join(__dirname, nom + '.json')

    function read() {
        if (!fs.existsSync(dbpath)) fs.writeFileSync(dbpath, '[]')
        return JSON.parse(fs.readFileSync(dbpath, 'utf-8'))
    }

    function write(data) {
        const tmp = dbpath + '.tmp'
        fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
        fs.renameSync(tmp, dbpath)
    }

    function add(item) {
        const data = read()
        const newItem = { id: crypto.randomUUID(), date: Date.now(), ...item }
        data.push(newItem)
        write(data)
        return newItem
    }

    function getAll() {
        return read()
    }

    function find(predicate) {
        return read().filter(predicate)
    }

    function findOne(predicate) {
        return read().find(predicate)
    }

    function update(id, changes) {
        const data = read()
        const index = data.findIndex(item => item.id === id)
        if (index === -1) return null
        data[index] = { ...data[index], ...changes, id }
        write(data)
        return data[index]
    }

    function remove(id) {
        const data = read()
        const filtered = data.filter(item => item.id !== id)
        if (filtered.length === data.length) return false
        write(filtered)
        return true
    }

    return { add, getAll, find, findOne, update, remove }
}

// --- DB de la roue ---
const users = createDb('users')

function getLastByMail(mail) {
    const entries = users.find(item => item.mail === mail)
    return entries[entries.length - 1]
}

function masquerMail(mail) {
    const [nom = '', domaine = ''] = mail.split('@')
    return nom.slice(0, 2) + '*'.repeat(5) + '@' + domaine
}

function getLastWin() {
    return users
        .find(item => item.lot !== 'Perdu')
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10)
        .map(item => ({
            mail: masquerMail(item.mail),
            lot: item.lot,
            date: item.date
        }))
}

module.exports = {
    createDb,
    add: users.add,
    getAll: users.getAll,
    remove: users.remove,
    getLastByMail,
    getLastWin,
    checkAdmin
}
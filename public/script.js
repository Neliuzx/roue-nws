const mailInput = document.getElementById('mailinput')
const roulette = document.getElementById('roulette-img')
const bouton = document.getElementById('bouton')
const form = bouton.closest('form')
const dialog = document.getElementById('overlay-lot')
const afficheLot = document.getElementById('lot-nom')
const btnClose = document.getElementById('fermer-overlay')
const overlayTitre = document.getElementById('overlay-titre')
const overlayTxt = document.getElementById('overlay-texte')

mailInput.placeholder = "Votre adresse e-mail"

const lots = [
    { nom: "Perdu", minAngle: 67.5, maxAngle: 112.5 },
    { nom: "1 café offert", minAngle: 22.5, maxAngle: 67.5 },
    { nom: "1 lot bleu", minAngle: 337.5, maxAngle: 22.5 },
    { nom: "1 café offert", minAngle: 292.5, maxAngle: 337.5 },
    { nom: "Perdu", minAngle: 247.5, maxAngle: 292.5 },
    { nom: "1 café offert", minAngle: 202.5, maxAngle: 247.5 },
    { nom: "1 lot bleu", minAngle: 157.5, maxAngle: 202.5 },
    { nom: "1 café offert", minAngle: 112.5, maxAngle: 157.5 }
]

let indexGagnant = null

function getAngle(element) {
    const matrix = getComputedStyle(element).transform
    if (matrix === "none") return 0
    const [a, b] = matrix.match(/matrix\((.+)\)/)[1].split(",").map(Number)
    return ((Math.atan2(b, a) * 180 / Math.PI) + 360) % 360
}

function afficherOverlay(titre, texte, lot = "") {
    overlayTitre.textContent = titre
    overlayTxt.textContent = texte
    afficheLot.textContent = lot
    dialog.showModal()
}

function lancerRoue() {
    const depart = getAngle(roulette)
    const angleLot = (lots[indexGagnant].minAngle + lots[indexGagnant].maxAngle) / 2

    roulette.style.setProperty('--depart', depart + 'deg')
    roulette.style.setProperty('--fin', (angleLot + 360 * 5) + 'deg')

    roulette.classList.remove('rotate-slow', 'rotate-fast')
    void roulette.offsetWidth
    roulette.classList.add('rotate-fast')
}

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    bouton.disabled = true

    try {
        const res = await fetch('/api/jouer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mail: mailInput.value })
        })
        const data = await res.json()

        if (!res.ok) {
            afficherOverlay("Oups...", data.erreur)
            bouton.disabled = false
            return
        }

        indexGagnant = data.index
        lancerRoue()
    } catch(err) {
        afficherOverlay("Erreur", err)
        bouton.disabled = false
    }
})

roulette.addEventListener('animationend', (e) => {
    if (e.animationName !== 'spin-fast') return

    if (lots[indexGagnant].nom === "Perdu") {
        afficherOverlay("Mince...", "Vous avez perdu, revenez une prochaine fois.")
    } else {
        afficherOverlay("Félicitations !", "Vous avez gagné :", lots[indexGagnant].nom)
    }
    bouton.disabled = false
})

btnClose.addEventListener('click', () => {
    dialog.close()
    window.location.reload()
})

const listeGagnants = document.getElementById('gagnants')

function ajouterColonne(parent, classe, texte) {
    const span = document.createElement('span')
    span.className = classe
    span.textContent = texte
    parent.appendChild(span)
}

async function chargerGagnants() {
    try {
        const res = await fetch('/api/gagnants')
        const gagnants = await res.json()

        listeGagnants.innerHTML = ''

        if (gagnants.length === 0) {
            const vide = document.createElement('li')
            vide.className = 'vide'
            vide.textContent = 'Aucun gagnant pour le moment'
            listeGagnants.appendChild(vide)
            return
        }

        gagnants.forEach(g => {
            const li = document.createElement('li')
            ajouterColonne(li, 'gagnant-lot', g.lot)
            ajouterColonne(li, 'gagnant-mail', g.mail)
            ajouterColonne(li, 'gagnant-date', new Date(g.date).toLocaleString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }))
            listeGagnants.appendChild(li)
        })
    } catch {
        listeGagnants.innerHTML = ''
    }
}

chargerGagnants()
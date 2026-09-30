const mailInput = document.getElementById('mailinput')
const roulette = document.getElementById('roulette-img')
const bouton = document.getElementById('bouton')
const form = bouton.closest('form')
const dialog = document.getElementById('overlay-lot')
const afficheLot = document.getElementById('lot-nom')
const btnClose = document.getElementById('fermer-overlay')
mailInput.placeholder = "Votre adresse e-mail"

const lots = [
    { nom: "1 café offert" },
    { nom: "1 café offert" },
    { nom: "1 café offert" },
    { nom: "1 café offert" },
    { nom: "1 café offert" },
    { nom: "1 café offert" },
    { nom: "1 café offert" },
    { nom: "1 café offert" }
]

let indexGagnant = null

function tirage() {
    return Math.floor(Math.random() * lots.length)
}

function getAngle(element) {
    const matrix = getComputedStyle(element).transform;
    if (matrix === "none") return 0;
    const [a, b] = matrix.match(/matrix\((.+)\)/)[1].split(",").map(Number)
    return ((Math.atan2(b, a) * 180 / Math.PI) + 360) % 360
}

form.addEventListener('submit', (e) => {
    e.preventDefault()
    bouton.disabled = true

    indexGagnant = tirage()

    const depart = getAngle(roulette)
    const fin = depart + 360 * 5 + Math.random() * 360   

    roulette.style.setProperty('--depart', depart + 'deg')
    roulette.style.setProperty('--fin', fin + 'deg')

    roulette.classList.remove('rotate-slow', 'rotate-fast')
    void roulette.offsetWidth
    roulette.classList.add('rotate-fast')
})

roulette.addEventListener('animationend', (e) => {
    if (e.animationName !== 'spin-fast') return

    const angleFinal = getAngle(roulette)
    console.log("Arrêtée à", angleFinal, "degrés - part tirée :", indexGagnant)
    afficheLot.textContent = lots[indexGagnant].nom
    dialog.showModal()
    bouton.disabled = false
})

btnClose.addEventListener('click', ()=>{
    dialog.close()
})
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
];

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
    const angleLot = (lots[indexGagnant].minAngle + lots[indexGagnant].maxAngle) / 2
    console.log(angleLot)
    
    roulette.style.setProperty('--depart', depart + 'deg')
    roulette.style.setProperty('--fin', (angleLot + 360 *5) + 'deg')

    roulette.classList.remove('rotate-slow', 'rotate-fast')
    void roulette.offsetWidth
    roulette.classList.add('rotate-fast')
})

roulette.addEventListener('animationend', (e) => {
    if (e.animationName !== 'spin-fast') return

    const angleFinal = getAngle(roulette)
    console.log(angleFinal)
    if(lots[indexGagnant].nom === "Perdu"){
        overlayTitre.textContent = "Mince..."
        overlayTxt.textContent = "Vous avez perdu, revenez une prochaine fois."
        dialog.showModal()
        bouton.disabled = false
    }else{
        overlayTitre.textContent = "Félicitations !"
        overlayTxt.textContent = "Vous avez gagné :"
        afficheLot.textContent = lots[indexGagnant].nom
        dialog.showModal()
        bouton.disabled = false
    }
     

    
})

btnClose.addEventListener('click', ()=>{
    dialog.close()
    window.location.reload()
})
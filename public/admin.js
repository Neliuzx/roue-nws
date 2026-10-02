const loginDialog = document.getElementById('overlay-connexion')
const usernameInput = document.getElementById('identifiant')
const passwordInput = document.getElementById('mdp')
const submitBtn = document.getElementById('btn-connexion')
const erreurConnexion = document.getElementById('connexion-erreur')
const dashboard = document.getElementById('dashboard')
const tableauParticipations = document.getElementById('tableau-participations')
const ctx = document.getElementById('myChart');
const statParticipations = document.getElementById('stat-participations')
const lotsGagnes = document.getElementById('stat-gagnants')
const statUtilisateurs = document.getElementById('stat-taux')
const btnExport = document.getElementById('btn-export')

let participations = []

loginDialog.showModal()

submitBtn.addEventListener('click', async (e) => {
    e.preventDefault()
    erreurConnexion.textContent = ''

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                password: passwordInput.value
            })
        })
        const data = await res.json()

        if (!res.ok) {
            erreurConnexion.textContent = data.erreur
            return
        }

        loginDialog.close()
        dashboard.hidden = false
        chargerParticipations()
    } catch (err) {
        console.log(err)
        erreurConnexion.textContent = 'Serveur injoignable.'
    }
})

async function chargerParticipations() {
    try {
        const res = await fetch('/api/admin/participations')
        const data = (await res.json())
            .sort((a, b) => new Date(b.date) - new Date(a.date))
        participations = data

        statParticipations.textContent = data.length
        lotsGagnes.textContent = data.filter(p => p.lot !== 'Perdu').length
        statUtilisateurs.textContent = new Set(data.map(p => p.mail)).size
        afficherGraphique(data)

        tableauParticipations.innerHTML = ''
        data.forEach(p => {
            const tr = document.createElement('tr')

            const tdDate = document.createElement('td')
            tdDate.textContent = formaterDate(p.date)

            const tdMail = document.createElement('td')
            tdMail.textContent = p.mail

            const tdLot = document.createElement('td')
            const badge = document.createElement('span')
            badge.className = p.lot === 'Perdu' ? 'badge badge-perdu' : 'badge badge-gagne'
            badge.textContent = p.lot
            tdLot.appendChild(badge)

            tr.append(tdDate, tdMail, tdLot)
            tableauParticipations.appendChild(tr)
        })
    } catch (err) {
        console.log(err)
    }
}

function formaterDate(date) {
    return new Date(date).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

btnExport.addEventListener('click', () => {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()
    const marge = 20
    let y = 25


    doc.setFontSize(12)
    doc.text(`Participations : ${participations.length}`, marge, y)
    y += 7
    doc.text(`Lots gagnés : ${participations.filter(p => p.lot !== 'Perdu').length}`, marge, y)
    y += 7
    doc.text(`Participants : ${new Set(participations.map(p => p.mail)).size}`, marge, y)
    y += 14

    doc.setFontSize(10)
    doc.text('Date', marge, y)
    doc.text('Mail', marge + 40, y)
    doc.text('Lot', marge + 120, y)
    y += 10

    participations.forEach(p => {
        if (y > 280) {
            doc.addPage()
            y = 20
        }
        doc.text(formaterDate(p.date), marge, y)
        doc.text(p.mail, marge + 40, y)
        doc.text(p.lot, marge + 120, y)
        y += 6
    })

    doc.save('participations.pdf')
})

let graphique = null

function afficherGraphique(participations) {
    const lots = ['1 café offert', '1 lot bleu', 'Perdu']
    const comptes = lots.map(lot => participations.filter(p => p.lot === lot).length)

    if (graphique) {
        graphique.data.datasets[0].data = comptes
        graphique.update()
        return
    }

    graphique = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: lots,
            datasets: [{
                label: 'Participations',
                data: comptes,
                backgroundColor: [
                    '#00a5a5',
                    '#fec800',
                    '#e94a34'
                ],
                borderColor: '#fff',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: '"Fugaz One", sans-serif', size: 13 },
                        usePointStyle: true,
                        padding: 16
                    }
                },
                tooltip: {
                    callbacks: {
                        label: (item) => {
                            const total = item.dataset.data.reduce((a, b) => a + b, 0) || 1
                            const pourcentage = Math.round(item / total * 100)
                            return ` ${item} (${pourcentage} %)`
                            console.log(item);
                            
                        }
                    }
                }
            }
        }
    })
}

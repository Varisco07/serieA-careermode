const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
        const clubs = [
            ['Atalanta', 7, '#1e71b8'], ['Bologna', 5, '#a8192e'], ['Cagliari', 2, '#a41e35'], ['Como', 3, '#1b5aa7'], ['Frosinone', 2, '#f2c500'], ['Fiorentina', 4, '#6a2f9e'], ['Genoa', 3, '#a31c2c'], ['Inter', 9, '#0a3a8a'], ['Juventus', 9, '#e9e9e9'], ['Lazio', 6, '#87c5ec'], ['Lecce', 2, '#f2c500'], ['Milan', 8, '#c8102e'], ['Napoli', 8, '#12a0d7'], ['Parma', 3, '#f2c500'], ['Monza', 2, '#c8102e'], ['Roma', 6, '#8e1f2f'], ['Sassuolo', 3, '#0a8a4a'], ['Torino', 3, '#7a1f1f'], ['Udinese', 3, '#cfcfcf'], ['Venezia', 1, '#0a7a4a']
        ];
        const roles = [
            ['POR', 'Portiere', 0.01, 0.03], ['DC', 'Difensore', 0.04, 0.07], ['TS', 'Terzino sinistro', 0.04, 0.12], ['TD', 'Terzino destro', 0.04, 0.12], ['CC', 'Centrocampista', 0.10, 0.19], ['TRQ', 'Trequartista', 0.16, 0.23], ['AS', 'Ala sinistra', 0.22, 0.20], ['AD', 'Ala destra', 0.22, 0.20], ['ATT', 'Attaccante', 0.34, 0.13]
        ];
        const layout = [['AS', 'ATT', 'AD'], ['CC', 'TRQ', 'CC'], ['TS', 'DC', 'DC', 'TD'], ['POR']];
        const zone = k => k < 4 ? '#3dff9a' : k < 6 ? '#ff9a3d' : k == 6 ? '#3dc6ff' : k > 16 ? '#ff4d6a' : 'transparent';
        let selectedRole = 'ATT';
        let selectedFoot = 'Destro';
        let player = null;
        let currentClub = null;
        let seasonNumber = 0;
        let careerHistory = [];
        let latestLeague = null;
        let careerTrophies = [];
        let pendingOffers = [];
        let pendingEvent = null;
        let lastSeasonMarkup = '';
        let careerPhase = 'ready';
        const CAREER_STORAGE_KEY = 'serieA_playerCareer_v2';
        const CAREER_EVENTS = [
            {
                kicker: 'GIORNATA 15 · EMERGENZA',
                title: 'Esordisci, ma fuori ruolo',
                copy: 'Tre infortuni hanno svuotato il reparto. Lo staff ti chiede una risposta: puoi adattarti, proteggere il tuo ruolo o prenderti la scena.',
                choices: [
                    { id: 'adapt', title: 'Dove serve', copy: 'Accetti la posizione nuova e aiuti la squadra.', chance: 65, success: 'La duttilità convince l’allenatore: più minuti e fiducia.', fail: 'La posizione è nuova, ma l’esperienza ti farà crescere.', growth: 1, form: 0.25 },
                    { id: 'talk', title: 'Chiedere il tuo ruolo', copy: 'Parli con il tecnico e chiedi continuità.', chance: 50, success: 'Il confronto funziona: giochi nel tuo ruolo e sali nelle gerarchie.', fail: 'Il tecnico non cambia idea: dovrai guadagnarti spazio.', growth: 0, form: 0.05 },
                    { id: 'prove', title: 'Accettare e sorprendere', copy: 'Ti prendi il rischio e provi a conquistare il posto.', chance: 40, success: 'Prestazione da ricordare: il tuo nome gira tra gli osservatori.', fail: 'La scommessa non paga subito, ma lo staff apprezza il coraggio.', growth: 2, form: 0.55 }
                ]
            },
            {
                kicker: 'ALLENAMENTO · SVOLTA',
                title: 'Una settimana che può cambiarti',
                copy: 'Il preparatore propone un lavoro extra prima della fase decisiva. Più carico può voler dire più crescita, ma anche arrivare stanco alle partite.',
                choices: [
                    { id: 'steady', title: 'Dove serve', copy: 'Segui il programma della squadra senza forzare.', chance: 70, success: 'Ritrovi ritmo e continuità.', fail: 'Settimana ordinaria: nessun danno, nessun salto.', growth: 1, form: 0.15 },
                    { id: 'coach', title: 'Chiedere un piano mirato', copy: 'Lavori sul dettaglio tecnico che ti manca.', chance: 55, success: 'Il lavoro paga: migliora la tua valutazione.', fail: 'Progressi lenti, ma hai individuato cosa allenare.', growth: 1, form: 0.2 },
                    { id: 'extra', title: 'Accettare e sorprendere', copy: 'Raddoppi le sedute e punti a una svolta.', chance: 38, success: 'Salto di qualità: preparazione e fiducia al massimo.', fail: 'La fatica si sente nel breve, ma la disciplina resta.', growth: 2, form: 0.6 }
                ]
            },
            {
                kicker: 'MERCATO · VOCE DI CORRIDOIO',
                title: 'Un osservatore è venuto a vederti',
                copy: 'Un club ha chiesto informazioni. Puoi concentrarti sul campo, parlarne con il tuo agente o usare l’attenzione per chiedere più responsabilità.',
                choices: [
                    { id: 'focus', title: 'Dove serve', copy: 'Tieni la testa sulla prossima partita.', chance: 68, success: 'La serenità si vede in campo.', fail: 'Le voci continuano, ma resti concentrato.', growth: 1, form: 0.25 },
                    { id: 'agent', title: 'Chiedere un confronto', copy: 'Il tuo agente raccoglie informazioni senza forzare l’uscita.', chance: 52, success: 'Il tuo nome guadagna attenzione nel mercato.', fail: 'Per ora non arriva una proposta concreta.', growth: 0, form: 0.12 },
                    { id: 'lead', title: 'Prenderti la scena', copy: 'Chiedi più minuti e trasformi la pressione in motivazione.', chance: 42, success: 'La risposta è da leader: cresce la reputazione.', fail: 'La concorrenza resta alta, ma hai mandato un segnale.', growth: 2, form: 0.5 }
                ]
            }
        ];
        const awardCatalog = {
            scudetto: ['SCUDETTO', 'Campione d’Italia'],
            coppa: ['COPPA ITALIA', 'Vincitore della coppa nazionale'],
            champions: ['CHAMPIONS LEAGUE', 'Campione d’Europa'],
            goldenBoot: ['CAPOCANNONIERE', 'Miglior marcatore del campionato'],
            ballon: ['PALLONE D’ORO', 'Miglior giocatore della stagione']
        };
        const clubSelect = $('#club-choice');
        clubSelect.innerHTML = clubs.map(([name, strength], index) => `<option value="${index}">${name} · ${strength}/9</option>`).join('');
        $('#positions').innerHTML = roles.map(([code, name], index) => `<button class="pill" type="button" data-role="${code}" title="${name}" aria-label="${name}" aria-pressed="${index === 8}">${code}</button>`).join('');
        $('#positions').addEventListener('click', event => {
            const button = event.target.closest('[data-role]');
            if (!button) return;
            selectedRole = button.dataset.role;
            document.querySelectorAll('#positions .pill').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
            updatePreview();
        });
        $('#feet').addEventListener('click', event => {
            const button = event.target.closest('[data-foot]');
            if (!button) return;
            selectedFoot = button.dataset.foot;
            document.querySelectorAll('#feet .pill').forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
        });
        $('#player-name').addEventListener('input', updatePreview);
        $('#shirt-number').addEventListener('input', updatePreview);
        clubSelect.addEventListener('change', updatePreview);
        function drawPitch() {
            let used = false;
            $('#pitch').innerHTML = layout.map(row => `<div class="prow">${row.map(code => {
                const me = !used && code === selectedRole; if (me) used = true;
                return `<span class="avatar${me ? ' me' : ''}">${me ? ($('#shirt-number').value || '•') : code}</span>`;
            }).join('')}</div>`).join('');
        }
        function updatePreview() {
            const role = roles.find(item => item[0] === selectedRole);
            const club = clubs[Number(clubSelect.value)];
            $('#preview-name').textContent = ($('#player-name').value.trim() || 'NUOVO TALENTO').toUpperCase();
            $('#preview-role').textContent = role[1].toUpperCase();
            $('#preview-club').textContent = club[0].toUpperCase();
            $('.preview').style.setProperty('--pc', club[2]);
            drawPitch();
        }
        function randomFrom(seed) {
            let value = seed >>> 0;
            return () => {
                value = (value * 1664525 + 1013904223) >>> 0;
                return value / 4294967296;
            };
        }
        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
        }
        function saveCareer() {
            if (!player || !currentClub) return;
            try {
                localStorage.setItem(CAREER_STORAGE_KEY, JSON.stringify({
                    player, currentClub, seasonNumber, careerHistory, latestLeague, careerTrophies,
                    pendingOffers, pendingEvent, lastSeasonMarkup, careerPhase
                }));
            } catch (error) {
                $('#career-msg').textContent = 'SALVATAGGIO NON DISPONIBILE IN QUESTO BROWSER';
            }
        }
        function poisson(mean, random) {
            const limit = Math.exp(-mean);
            let value = 1;
            let goals = 0;
            do { goals++; value *= Math.max(random(), Number.EPSILON); } while (value > limit);
            return goals - 1;
        }
        function simulateLeague(userClub, playerOverall, random) {
            const table = clubs.map(([name, strength], id) => ({ id, name, strength: strength + (id === userClub ? Math.max(-1, (playerOverall - 65) * 0.08) : 0), played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, points: 0 }));
            let rotation = table.map(team => team.id);
            const firstHalf = [];
            for (let round = 0; round < rotation.length - 1; round++) {
                const fixtures = [];
                for (let index = 0; index < rotation.length / 2; index++) {
                    let home = rotation[index];
                    let away = rotation[rotation.length - 1 - index];
                    if (random() < 0.5) [home, away] = [away, home];
                    fixtures.push([home, away]);
                }
                firstHalf.push(fixtures);
                rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
            }
            const fullSeason = [...firstHalf, ...firstHalf.map(round => round.map(([home, away]) => [away, home]))];
            for (const round of fullSeason) for (const [homeId, awayId] of round) {
                const home = table[homeId];
                const away = table[awayId];
                const homeGoals = poisson(Math.max(0.25, Math.min(3.2, 1.4 + (home.strength - away.strength) * 0.16)), random);
                const awayGoals = poisson(Math.max(0.2, Math.min(3.0, 1.05 + (away.strength - home.strength) * 0.14)), random);
                home.played++; away.played++;
                home.gf += homeGoals; home.ga += awayGoals; away.gf += awayGoals; away.ga += homeGoals;
                if (homeGoals > awayGoals) { home.wins++; home.points += 3; away.losses++; }
                else if (awayGoals > homeGoals) { away.wins++; away.points += 3; home.losses++; }
                else { home.draws++; away.draws++; home.points++; away.points++; }
            }
            return table.sort((a, b) => b.points - a.points || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
        }
        function renderCareer() {
            $('#career-name').textContent = player.name;
            $('#career-sub').textContent = `${player.age} ANNI · ${currentClub.name.toUpperCase()} · N°${player.number} · ${player.nationality.toUpperCase()}`;
            $('#career-view').style.setProperty('--pc', clubs[currentClub.id][2]);
            $('#career-stats').innerHTML = [
                ['RUOLO', player.role], ['OVR', player.overall], ['POTENZIALE', player.potential], ['STAGIONI', seasonNumber], ['PREMI', careerTrophies.length]
            ].map(([label, value]) => `<div class="kpi"><small>${label}</small><strong class="cond">${value}</strong></div>`).join('');
            $('#play-season').disabled = player.age >= 38 || careerPhase === 'event' || careerPhase === 'offers';
            $('#play-season').textContent = player.age >= 38 ? 'CARRIERA CONCLUSA' : careerPhase === 'offers' ? 'DECIDI IL TUO FUTURO' : careerPhase === 'event' ? 'SCEGLI L’EVENTO' : `GIOCA LA STAGIONE ${seasonNumber + 1} →`;
            $('#stay-club').classList.toggle('hidden', careerPhase !== 'offers');
            $('#history-body').innerHTML = careerHistory.map(row => `<tr><td>${row.year}</td><td>${row.age}</td><td class="l">${row.club}</td><td>${row.apps}</td><td>${row.goals}</td><td>${row.assists}</td><td>${row.place}°</td><td class="pt">${row.points}</td></tr>`).join('');
            $('#career-history').classList.toggle('hidden', careerHistory.length === 0);
            $('#career-cabinet').classList.toggle('hidden', careerTrophies.length === 0);
            $('#cabinet-count').textContent = `${careerTrophies.length} ${careerTrophies.length === 1 ? 'TROFEO' : 'TROFEI'}`;
            $('#career-trophies').innerHTML = careerTrophies.slice().reverse().map(trophy => `<article class="trophy-item"><span aria-hidden="true">${trophy.icon}</span><b>${escapeHtml(trophy.name)}</b><small>${trophy.year} · ${escapeHtml(trophy.description)}</small></article>`).join('');
            saveCareer();
        }
        function showResult(html, single) {
            const box = $('#season-result');
            box.innerHTML = html;
            box.classList.toggle('single', !!single);
            box.classList.remove('hidden');
            lastSeasonMarkup = html;
            saveCareer();
        }

        function renderSeasonEvent() {
            if (!pendingEvent) return;
            $('#event-kicker').textContent = `${pendingEvent.kicker} · STAGIONE ${seasonNumber + 1}`;
            $('#event-title').textContent = pendingEvent.title;
            $('#event-copy').textContent = pendingEvent.copy;
            $('#event-choices').innerHTML = pendingEvent.choices.map(choice => `<button class="career-choice" type="button" data-choice="${choice.id}"><span class="career-choice-copy"><b>${choice.title}</b><small>${choice.copy}</small></span><span class="career-choice-odds"><b>${choice.chance}%</b><i><em style="width:${choice.chance}%"></em><em style="width:${100 - choice.chance}%"></em></i><small>RIUSCITA · RISCHIO</small></span><span class="career-choice-arrow" aria-hidden="true">→</span></button>`).join('');
            $('#career-event').classList.remove('hidden');
        }

        function careerEventForNextSeason() {
            const event = CAREER_EVENTS[seasonNumber % CAREER_EVENTS.length];
            pendingEvent = { ...event, choices: event.choices.map(choice => ({ ...choice })) };
            careerPhase = 'event';
            lastSeasonMarkup = '';
            $('#season-result').classList.add('hidden');
            $('#career-msg').textContent = '';
            renderSeasonEvent();
            renderCareer();
            saveCareer();
            $('#career-event').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function collectSeasonAwards(record, random) {
            const earned = [];
            const add = key => {
                const [name, description] = awardCatalog[key];
                const icons = { scudetto: '★', coppa: '🏆', champions: '✦', goldenBoot: '⚽', ballon: '★' };
                const award = { key, name, description, icon: icons[key], year: record.year };
                earned.push(award);
                careerTrophies.push(award);
            };
            if (record.place === 1) add('scudetto');
            const clubStrength = clubs[currentClub.id][1];
            const cupChance = Math.max(0.1, Math.min(0.48, 0.08 + clubStrength * 0.035 + (record.place <= 4 ? 0.1 : 0) + (record.averageRating - 6.5) * 0.045));
            if (random() < cupChance) add('coppa');
            if (record.place <= 4 && random() < Math.min(0.28, 0.045 + Math.max(0, record.averageRating - 7) * 0.05)) add('champions');
            const leagueTopScorer = Math.max(record.goals, 16 + Math.max(0, 9 - clubs[currentClub.id][1]) * 0.8 + random() * 8);
            if (record.goals >= leagueTopScorer) add('goldenBoot');
            const contribution = record.goals + record.assists;
            if (player.overall >= 82 && record.place <= 4 && record.averageRating >= 7.5 && contribution >= 20) {
                const ballonChance = Math.min(0.82, 0.12 + (player.overall - 82) * 0.035 + (record.averageRating - 7.5) * 0.32 + Math.max(0, contribution - 20) * 0.008);
                if (random() < ballonChance) add('ballon');
            }
            return earned;
        }

        function generateTransferOffers(record, earned, random) {
            const contributionBonus = Math.min(12, record.goals * 0.28 + record.assists * 0.22);
            const positionBonus = record.place <= 4 ? 7 : record.place <= 10 ? 3 : record.place >= 18 ? -5 : 0;
            const awardBonus = earned.some(award => award.key === 'ballon') ? 10 : earned.length ? 3 : 0;
            const scoutingScore = player.overall + contributionBonus + positionBonus + awardBonus + (record.eventSucceeded ? 2 : 0);
            if (scoutingScore < 58) return [];
            const strengthCeiling = Math.max(2, Math.min(9, Math.floor((scoutingScore - 48) / 5)));
            let candidates = clubs.map(([name, strength, color], id) => ({ id, name, strength, color }))
                .filter(club => club.id !== currentClub.id && club.strength <= strengthCeiling)
                .sort((a, b) => b.strength - a.strength);
            if (!candidates.length && scoutingScore >= 76) candidates = clubs.map(([name, strength, color], id) => ({ id, name, strength, color })).filter(club => club.id !== currentClub.id).sort((a, b) => b.strength - a.strength).slice(0, 2);
            const count = scoutingScore >= 100 ? 3 : scoutingScore >= 84 ? 2 : 1;
            return candidates.slice(0, count).map(club => ({
                ...club,
                weeklyWage: Math.round((player.overall * 34 + club.strength * 190) / 100) * 100,
                reason: club.strength > clubs[currentClub.id][1] ? 'Salto di categoria' : record.place <= 6 ? 'Progetto europeo' : 'Minuti da protagonista'
            }));
        }

        function renderAnnualReport(record, earned) {
            const awardMarkup = earned.length
                ? earned.map(award => `<span class="award-chip"><i>${award.icon}</i><b>${award.name}</b></span>`).join('')
                : '<span class="award-empty">Nessun trofeo quest’anno. La prossima stagione è tutta da scrivere.</span>';
            const offerMarkup = pendingOffers.length
                ? `<div class="offer-panel" id="offer-panel"><div class="offer-heading"><div><div class="lab">MERCATO · PROPOSTE UFFICIALI</div><h3 class="cond">TI VOGLIONO IN SQUADRA</h3></div><span>${pendingOffers.length} ${pendingOffers.length === 1 ? 'OFFERTA' : 'OFFERTE'}</span></div><p class="offer-intro">Il tuo rendimento ha attirato nuovi club. Scegli il progetto per la prossima stagione o resta dove sei.</p><div class="offer-list">${pendingOffers.map((offer, index) => `<article class="offer-row" style="--offer-color:${offer.color}"><div class="offer-club"><i>${offer.name.slice(0, 3).toUpperCase()}</i><span><b>${offer.name}</b><small>${offer.reason} · ${offer.strength}/9</small></span></div><div class="offer-wage"><small>INGAGGIO SETTIMANALE</small><b>€ ${offer.weeklyWage.toLocaleString('it-IT')}</b></div><button class="offer-accept" type="button" data-offer="${index}">ACCETTA →</button></article>`).join('')}</div></div>`
                : `<div class="offer-panel no-offers" id="offer-panel"><div class="lab">MERCATO · NESSUNA OFFERTA</div><p>Continua a crescere: il prossimo anno altri club potrebbero farsi avanti.</p></div>`;
            const table = `<div class="career-league-table"><div class="block-title">CLASSIFICA FINALE · ${record.year}/${record.year + 1}</div><div class="tw"><table><thead><tr><th>POS</th><th class="l">CLUB</th><th>PG</th><th>DR</th><th>PT</th></tr></thead><tbody>${latestLeague.map((team, index) => `<tr class="${team.id === currentClub.id ? 'me' : ''}" style="--z:${zone(index)}"><td>${index + 1}</td><td class="l cond">${escapeHtml(team.name)}</td><td>${team.played}</td><td>${team.gf - team.ga}</td><td class="pt">${team.points}</td></tr>`).join('')}</tbody></table></div></div>`;
            const trophyLabel = record.place === 1 ? 'CAMPIONE D’ITALIA' : record.place <= 4 ? 'CHAMPIONS LEAGUE' : record.place <= 6 ? 'EUROPA LEAGUE' : record.place === 7 ? 'CONFERENCE LEAGUE' : record.place >= 18 ? 'LOTTA SALVEZZA' : 'STAGIONE COMPLETATA';
            const eventLabel = record.eventSucceeded ? record.event.success : record.event.fail;
            const markup = `<div class="career-result-hero" style="--pc:${clubs[currentClub.id][2]}"><div class="career-result-heading"><span class="lab">STAGIONE ${record.year}/${record.year + 1} · ${currentClub.name.toUpperCase()}</span><span class="career-final-place">${record.place}°</span></div><h3 class="cond">${trophyLabel}</h3><p>${record.points} punti · ${record.wins}V ${record.draws}N ${record.losses}P · media voto ${record.averageRating.toFixed(1)}</p><div class="season-stat-strip"><span><b>${record.apps}</b><small>PRESENZE</small></span><span><b>${record.goals}</b><small>GOL</small></span><span><b>${record.assists}</b><small>ASSIST</small></span><span><b>${record.overallChange > 0 ? '+' : ''}${record.overallChange}</b><small>OVR</small></span></div><p class="event-consequence">${eventLabel}</p></div><section class="award-report"><div class="block-title">TROFEI E RICONOSCIMENTI</div><div class="award-list">${awardMarkup}</div></section>${offerMarkup}${table}`;
            showResult(markup, false);
        }

        function renderSeasonEvent() {
            if (!pendingEvent) return;
            $('#event-kicker').textContent = `${pendingEvent.kicker} · STAGIONE ${seasonNumber + 1}`;
            $('#event-title').textContent = pendingEvent.title;
            $('#event-copy').textContent = pendingEvent.copy;
            $('#event-choices').innerHTML = pendingEvent.choices.map(choice => `<button class="career-choice" type="button" data-choice="${choice.id}"><span class="career-choice-copy"><b>${choice.title}</b><small>${choice.copy}</small></span><span class="career-choice-odds"><b>${choice.chance}%</b><i><em style="width:${choice.chance}%"></em><em style="width:${100 - choice.chance}%"></em></i><small>RIUSCITA · RISCHIO</small></span><span class="career-choice-arrow" aria-hidden="true">→</span></button>`).join('');
            $('#career-event').classList.remove('hidden');
        }

        function beginNextSeason() {
            if (!player || player.age >= 38 || careerPhase === 'offers' || careerPhase === 'event') return;
            pendingEvent = { ...CAREER_EVENTS[seasonNumber % CAREER_EVENTS.length], choices: CAREER_EVENTS[seasonNumber % CAREER_EVENTS.length].choices.map(choice => ({ ...choice })) };
            careerPhase = 'event';
            lastSeasonMarkup = '';
            $('#season-result').classList.add('hidden');
            $('#career-msg').textContent = '';
            renderSeasonEvent();
            renderCareer();
            $('#career-event').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function simulateCareerSeason(choiceId) {
            const eventChoice = pendingEvent.choices.find(choice => choice.id === choiceId);
            if (!eventChoice) return;
            const seasonAge = player.age;
            seasonNumber++;
            const seed = Math.round(Date.now() % 2147483647) ^ player.number * 331 ^ seasonNumber * 49157 ^ player.overall * 97;
            const random = randomFrom(seed);
            const eventSucceeded = random() * 100 < eventChoice.chance;
            const role = roles.find(item => item[0] === player.role);
            const apps = Math.max(8, Math.min(38, Math.round(20 + random() * 14 + (player.overall - 60) * 0.13 - Math.max(0, seasonAge - 32) * 1.1 + (eventSucceeded ? 2 : 0))));
            const goals = Math.max(0, Math.round(apps * role[2] * (0.65 + player.overall / 90) + random() * 4 - 1));
            const assists = Math.max(0, Math.round(apps * role[3] * (0.65 + player.overall / 100) + random() * 3 - 1));
            latestLeague = simulateLeague(currentClub.id, player.overall, random);
            const standing = latestLeague.findIndex(team => team.id === currentClub.id) + 1;
            const userTeam = latestLeague[standing - 1];
            const averageRating = Math.max(5.8, Math.min(9.5, 6.1 + random() * 0.8 + (standing <= 4 ? 0.35 : standing >= 18 ? -0.3 : 0) + (goals + assists >= 18 ? 0.35 : 0) + (eventSucceeded ? eventChoice.form : -0.12)));
            const year = 2026 + seasonNumber - 1;
            const record = { year, age: seasonAge, club: currentClub.name, apps, goals, assists, place: standing, points: userTeam.points, wins: userTeam.wins, draws: userTeam.draws, losses: userTeam.losses, averageRating, event: eventChoice, eventSucceeded, overAllBefore: player.overall };
            const earned = collectSeasonAwards(record, random);
            const rawGrowth = seasonAge <= 27
                ? Math.round((averageRating - 6.65) * 1.25 + (eventSucceeded ? eventChoice.growth : 0) + random() * 1.3 - 0.5)
                : seasonAge <= 31
                    ? Math.round((averageRating - 7) * 0.85 + (eventSucceeded ? eventChoice.growth * 0.45 : 0) + random() * 0.8 - 0.35)
                    : -Math.max(1, Math.round(Math.max(0.4, (seasonAge - 31) * 0.35 + (averageRating < 6.7 ? 0.8 : 0) - (averageRating > 7.8 ? 0.55 : 0)) + random() * 0.4));
            const growth = Math.max(-2, Math.min(4, rawGrowth));
            const nextOverall = Math.max(45, Math.min(99, player.overall + growth));
            player.overall = seasonAge <= 28 ? Math.min(player.potential, nextOverall) : nextOverall;
            if (seasonAge <= 23 && averageRating >= 8 && player.potential < 99 && random() < 0.28) player.potential++;
            record.overallChange = player.overall - record.overAllBefore;
            careerHistory.unshift(record);
            player.age++;
            pendingOffers = generateTransferOffers(record, earned, random);
            careerPhase = pendingOffers.length ? 'offers' : 'ready';
            pendingEvent = null;
            $('#career-event').classList.add('hidden');
            $('#career-msg').textContent = pendingOffers.length ? 'LE OFFERTE SONO ARRIVATE: SCEGLI IL TUO PROSSIMO PASSO.' : 'STAGIONE ARCHIVIATA. PREPARATI PER LA PROSSIMA.';
            renderAnnualReport(record, earned);
            renderCareer();
            $('#season-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function resolveOffers(acceptedIndex = null) {
            if (careerPhase !== 'offers') return;
            if (acceptedIndex !== null) {
                const offer = pendingOffers[acceptedIndex];
                if (!offer) return;
                currentClub = { id: offer.id, name: offer.name };
                $('#career-msg').textContent = `${player.name.toUpperCase()} FIRMA CON ${offer.name.toUpperCase()}. NUOVA STAGIONE, NUOVO OBIETTIVO.`;
            } else {
                $('#career-msg').textContent = `RESTI A ${currentClub.name.toUpperCase()}. IL POSTO DA TITOLARE È TUO.`;
            }
            pendingOffers = [];
            careerPhase = 'ready';
            const offerPanel = $('#offer-panel');
            if (offerPanel) offerPanel.innerHTML = `<div class="offer-decision"><span>${acceptedIndex === null ? 'SCELTA FATTA' : 'TRASFERIMENTO CONFERMATO'}</span><b>${acceptedIndex === null ? `RESTI A ${escapeHtml(currentClub.name)}` : `NUOVA MAGLIA · ${escapeHtml(currentClub.name)}`}</b></div>`;
            lastSeasonMarkup = $('#season-result').innerHTML;
            renderCareer();
            saveCareer();
        }
        $('#player-form').addEventListener('submit', event => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get('name') || '').trim();
            const number = Number(form.get('number'));
            const age = Number(form.get('age'));
            const role = roles.find(item => item[0] === selectedRole);
            if (!name || number < 1 || number > 99 || age < 16 || age > 20) { $('#form-notice').textContent = 'Controlla nome, numero e età.'; return; }
            $('#form-notice').textContent = '';
            const clubId = Number(clubSelect.value);
            const random = randomFrom(Date.now() ^ name.length * 8191 ^ clubId * 7919);
            player = { name, number, age, role: selectedRole, foot: selectedFoot, nationality: $('#nationality').value, overall: Math.round(55 + random() * 17 + (role[0] === 'ATT' ? 2 : 0)), potential: Math.round(77 + random() * 19) };
            currentClub = { id: clubId, name: clubs[clubId][0] };
            seasonNumber = 0;
            careerHistory = [];
            latestLeague = null;
            careerTrophies = [];
            pendingOffers = [];
            pendingEvent = null;
            careerPhase = 'ready';
            lastSeasonMarkup = '';
            $('#preview-rating').textContent = player.overall;
            $('#season-result').classList.add('hidden');
            $('#career-event').classList.add('hidden');
            $('#career-msg').textContent = '';
            $('#create-view').classList.add('hidden');
            $('#career-view').classList.remove('hidden');
            renderCareer();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        $('#play-season').addEventListener('click', beginNextSeason);
        $('#event-choices').addEventListener('click', event => {
            const choice = event.target.closest('[data-choice]');
            if (!choice || careerPhase !== 'event') return;
            simulateCareerSeason(choice.dataset.choice);
        });
        $('#season-result').addEventListener('click', event => {
            const offerButton = event.target.closest('[data-offer]');
            if (offerButton) resolveOffers(Number(offerButton.dataset.offer));
        });
        $('#stay-club').addEventListener('click', () => resolveOffers());
        $('#new-career').addEventListener('click', () => {
            player = null; currentClub = null; seasonNumber = 0; careerHistory = []; latestLeague = null;
            careerTrophies = []; pendingOffers = []; pendingEvent = null; lastSeasonMarkup = ''; careerPhase = 'ready';
            localStorage.removeItem(CAREER_STORAGE_KEY);
            $('#season-result').classList.add('hidden'); $('#preview-rating').textContent = '--'; $('#form-notice').textContent = ''; $('#career-msg').textContent = '';
            $('#career-event').classList.add('hidden');
            $('#player-form').reset(); selectedRole = 'ATT'; selectedFoot = 'Destro';
            document.querySelectorAll('#positions .pill').forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.role === 'ATT')));
            document.querySelectorAll('#feet .pill').forEach(choice => choice.setAttribute('aria-pressed', String(choice.dataset.foot === selectedFoot)));
            updatePreview(); $('#career-view').classList.add('hidden'); $('#create-view').classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        /* effetti del sito: titoli a parole, reveal, menu, cursore, bottoni magnetici */
        $$('[data-w]').forEach(h => { const walk = n => [...n.childNodes].forEach(c => { if (c.nodeType == 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach((w, i) => { if (!w.trim()) return f.append(w); const s = document.createElement('span'); s.className = 'w'; s.textContent = w; s.style.transitionDelay = (i * .06) + 's'; f.append(s) }); c.replaceWith(f) } else walk(c) }); walk(h) });
        if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('on'); io.unobserve(e.target) }), { threshold: .2 });
            $$('.rv').forEach(e => io.observe(e));
        } else $$('.rv').forEach(e => e.classList.add('on'));
        $('#bg').onclick = () => $('#nav').classList.toggle('m');
        $$('#nav a').forEach(a => a.addEventListener('click', () => $('#nav').classList.remove('m')));
        const cu = $('#cur'); addEventListener('pointermove', e => { cu.style.transform = `translate(${e.clientX - 7}px,${e.clientY - 7}px)` });
        $$('.mag').forEach(b => { b.onmousemove = e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.x - r.width / 2) * .25}px,${(e.clientY - r.y - r.height / 2) * .4}px)` }; b.onmouseleave = () => b.style.transform = '' });

        updatePreview();
        try {
            const saved = JSON.parse(localStorage.getItem(CAREER_STORAGE_KEY) || 'null');
            if (saved?.player && saved?.currentClub && clubs[saved.currentClub.id]) {
                player = saved.player;
                currentClub = saved.currentClub;
                seasonNumber = saved.seasonNumber || 0;
                careerHistory = saved.careerHistory || [];
                latestLeague = saved.latestLeague || null;
                careerTrophies = saved.careerTrophies || [];
                pendingOffers = saved.pendingOffers || [];
                pendingEvent = saved.pendingEvent || null;
                lastSeasonMarkup = saved.lastSeasonMarkup || '';
                careerPhase = saved.careerPhase || 'ready';
                $('#preview-rating').textContent = player.overall;
                $('#create-view').classList.add('hidden');
                $('#career-view').classList.remove('hidden');
                renderCareer();
                if (pendingEvent) renderSeasonEvent();
                if (lastSeasonMarkup) {
                    $('#season-result').innerHTML = lastSeasonMarkup;
                    $('#season-result').classList.remove('hidden');
                }
            }
        } catch (error) {
            localStorage.removeItem(CAREER_STORAGE_KEY);
        }

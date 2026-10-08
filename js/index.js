document.addEventListener('DOMContentLoaded', () => {
            const TACTIC_PROFILES = {
                defensive: { label: 'DIFENSIVA', attack: -0.34, defence: 0.5, possession: -4 },
                balanced: { label: 'EQUILIBRATA', attack: 0, defence: 0, possession: 0 },
                attacking: { label: 'OFFENSIVA', attack: 0.48, defence: -0.36, possession: 4 }
            };
            let activeSeason = null;
            let selectedTactic = 'balanced';
            let activeEuropeanCompetition = null;
            let europeanModalAction = 'close';

            const EUROPEAN_POOLS = {
                champions: ['AEK Athens', 'Arsenal', 'Aston Villa', 'Atlético Madrid', 'Barcelona', 'Bayern München', 'Bodø/Glimt', 'Borussia Dortmund', 'Club Brugge', 'Como', 'Fenerbahçe', 'Feyenoord', 'Galatasaray', 'Inter', 'LASK', 'RB Leipzig', 'Lens', 'Lille', 'Liverpool', 'Manchester City', 'Manchester United', 'Napoli', 'Paris Saint-Germain', 'Porto', 'PSV Eindhoven', 'Real Betis', 'Real Madrid', 'Roma', 'Sabah', 'Shakhtar Donetsk', 'Slavia Praha', 'Slovan Bratislava', 'Sporting CP', 'Stuttgart', 'Viking', 'Villarreal'],
                europa: ['Anderlecht', 'Ararat-Armenia', 'AZ Alkmaar', 'Benfica', 'Beşiktaş', 'Bournemouth', 'Celtic', 'Celje', 'Celta', 'Crystal Palace', 'GNK Dinamo', 'Hapoel Be’er Sheva', 'Hoffenheim', 'Bayer Leverkusen', 'Lech Poznań', 'Levski Sofia', 'Lillestrøm', 'Lyon', 'Marseille', 'Milan', 'N.E.C.', 'OFI Crete', 'Omonia', 'Olympiacos', 'Rennes', 'Real Sociedad', 'Salzburg', 'Sparta Praha', 'Sturm Graz', 'Sunderland', 'Torreense', 'Union SG', 'Ferencváros', 'Viktoria Plzeň', 'Qualificata UEFA 35'],
                conference: ['Aarhus', 'Ajax', 'Atalanta', 'Brighton', 'Getafe', 'Freiburg', 'Monaco', 'Braga', 'Twente', 'Gent', 'Sint-Truidense', 'Trabzonspor', 'Jablonec', 'Panathinaikos', 'Copenhagen', 'Midtjylland', 'Nordsjælland', 'Brann', 'Pafos', 'Lugano', 'Thun', 'Hearts', 'Mjällby', 'Hajduk Split', 'Crvena zvezda', 'Universitatea Craiova', 'Kairat Almaty', 'CSKA Sofia', 'KuPS Kuopio', 'Borac', 'Riga', 'Egnatia', 'Kauno Žalgiris', 'Lincoln Red Imps', 'Inter Escaldes', 'Iberia Tbilisi']
            };

            const EUROPEAN_DETAILS = {
                champions: { name: 'Champions League', color: '#d7b85a', matches: 8 },
                europa: { name: 'Europa League', color: '#f08d3c', matches: 8 },
                conference: { name: 'Conference League', color: '#67c77c', matches: 6 }
            };

            const LEGEND_REWARDS = [
                { id: 'buffon', name: 'Gianluigi Buffon', role: 'gk', overall: 98 },
                { id: 'cafu', name: 'Cafu', role: 'rb', overall: 97 },
                { id: 'maldini', name: 'Paolo Maldini', role: 'cb', overall: 99 },
                { id: 'baresi', name: 'Franco Baresi', role: 'cb', overall: 98 },
                { id: 'roberto-carlos', name: 'Roberto Carlos', role: 'lb', overall: 97 },
                { id: 'gullit', name: 'Ruud Gullit', role: 'cm', overall: 99 },
                { id: 'vieira', name: 'Patrick Vieira', role: 'cm', overall: 97 },
                { id: 'zidane', name: 'Zinedine Zidane', role: 'cm', overall: 98 },
                { id: 'ronaldinho', name: 'Ronaldinho', role: 'cam', overall: 98 },
                { id: 'ronaldo', name: 'Ronaldo (R9)', role: 'st', overall: 99 },
                { id: 'pele', name: 'Pelé', role: 'st', overall: 99 }
            ];
            window.LEGEND_REWARDS = LEGEND_REWARDS;
            let pendingLegendSeason = null;
            let selectedLegendReward = null;

            const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
            const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

            function showMatchResult(target, result) {
                const state = result.outcome === 'W' ? 'win' : result.outcome === 'L' ? 'loss' : 'draw';
                target.className = `matchday-message result-showcase result-${state}`;
                const particles = Array.from({ length: 14 }, (_, index) => `<i style="--x:${(index * 37) % 100}%;--wait:${(index % 5) * 45}ms;--turn:${index * 47}deg"></i>`).join('');
                target.innerHTML = `<div class="result-particles" aria-hidden="true">${particles}</div><div class="result-topline"><span>${escapeHtml(result.kicker)}</span><b>${result.outcome === 'W' ? 'VITTORIA' : result.outcome === 'L' ? 'SCONFITTA' : 'PAREGGIO'}</b></div><div class="result-scoreline"><div class="result-side"><i>${escapeHtml(result.home.slice(0, 3).toUpperCase())}</i><span>${escapeHtml(result.home)}</span></div><strong><b>${result.homeGoals}</b><em>:</em><b>${result.awayGoals}</b></strong><div class="result-side"><i>${escapeHtml(result.away.slice(0, 3).toUpperCase())}</i><span>${escapeHtml(result.away)}</span></div></div><p class="result-detail">${escapeHtml(result.detail)}</p><div class="result-energy"><i></i></div>`;
                void target.offsetWidth;
                target.classList.add('result-enter');
            }

            function getLeagueOrder(league) {
                return [...league].sort((a, b) => b.points - a.points
                    || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
                    || b.goalsFor - a.goalsFor
                    || b.strength - a.strength);
            }

            function createSeasonSimulation() {
                const userPlayers = Object.entries(userLineup).map(([slotId, player]) => ({
                    ...player,
                    slotId,
                    appearances: 0,
                    goals: 0,
                    assists: 0,
                    ratingTotal: 0,
                    playerOfMatch: 0,
                    cleanSheets: 0
                }));
                const fallbackOverall = userPlayers.reduce((sum, player) => sum + (player.overall ?? 75), 0) / userPlayers.length;
                const averageForRoles = roleSet => {
                    const selected = userPlayers.filter(player => roleSet.includes(player.role));
                    return selected.length ? selected.reduce((sum, player) => sum + (player.overall ?? 75), 0) / selected.length : fallbackOverall;
                };
                const toStrength = rating => clamp(1 + (rating - 55) * 0.22, 1, 9);
                const league = T.map((team, index) => ({
                    id: index,
                    name: team[0],
                    strength: toStrength(getClubOverall(index)),
                    rating: getClubOverall(index),
                    attack: toStrength(getClubOverall(index)),
                    midfield: toStrength(getClubOverall(index)),
                    defence: toStrength(getClubOverall(index)),
                    played: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    points: 0,
                    form: [],
                    isUser: false
                }));
                const replacement = league.reduce((weakest, team, index) => team.strength < league[weakest].strength ? index : weakest, 0);
                const replacedClub = league[replacement].name;
                const userTeamId = league[replacement].id;
                const overall = fallbackOverall;
                const attack = toStrength(averageForRoles(['lw', 'rw', 'st', 'cam']));
                const midfield = toStrength(averageForRoles(['cm', 'cam']));
                const defence = toStrength(averageForRoles(['cb', 'lb', 'rb', 'gk']));
                const gkOverall = averageForRoles(['gk']);
                const defendersOverall = averageForRoles(['cb', 'lb', 'rb']);
                league[replacement] = {
                    id: userTeamId,
                    name: userTeamName,
                    strength: toStrength(overall) + 0.8,
                    rating: overall,
                    attack: attack + 0.8,
                    midfield: midfield + 0.75,
                    defence: defence + 0.75 + Math.max(0, gkOverall - defendersOverall) * 0.012,
                    played: 0,
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    goalsFor: 0,
                    goalsAgainst: 0,
                    points: 0,
                    form: [],
                    isUser: true
                };

                let rotation = league.map(team => team.id);
                const firstHalf = [];
                for (let round = 0; round < 19; round++) {
                    const fixtures = [];
                    for (let index = 0; index < rotation.length / 2; index++) {
                        fixtures.push([rotation[index], rotation[rotation.length - 1 - index]]);
                    }
                    firstHalf.push(fixtures);
                    const last = rotation.pop();
                    rotation.splice(1, 0, last);
                }
                const schedule = [...firstHalf, ...firstHalf.map(round => round.map(([home, away]) => [away, home]))];
                return { league, schedule, userTeamId, replacedClub, players: userPlayers, round: 0, userFixtures: [], teamName: userTeamName };
            }

            function chooseWeightedPlayer(candidates, weightForPlayer) {
                const weights = candidates.map(player => Math.max(0.01, weightForPlayer(player)));
                let roll = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
                for (let index = 0; index < candidates.length; index++) {
                    roll -= weights[index];
                    if (roll <= 0) return candidates[index];
                }
                return candidates[candidates.length - 1];
            }

            function playerGoalWeight(player) {
                const roleWeight = { gk: 0.02, cb: 0.12, lb: 0.32, rb: 0.32, cm: 0.55, cam: 0.95, lw: 1.2, rw: 1.2, st: 1.75 }[player.role] || 0.4;
                return roleWeight * (0.72 + (player.overall ?? 75) / 100);
            }

            function recordPlayerMatch(season, goals, conceded, outcome) {
                const allPlayers = season.players;
                const matchGoals = new Map(allPlayers.map(player => [player, 0]));
                const matchAssists = new Map(allPlayers.map(player => [player, 0]));
                allPlayers.forEach(player => {
                    player.appearances++;
                    if (player.role === 'gk' && conceded === 0) player.cleanSheets++;
                });
                for (let goal = 0; goal < goals; goal++) {
                    const scorer = chooseWeightedPlayer(allPlayers, playerGoalWeight);
                    scorer.goals++;
                    matchGoals.set(scorer, matchGoals.get(scorer) + 1);
                    if (Math.random() < 0.72 && allPlayers.length > 1) {
                        const assistants = allPlayers.filter(player => player !== scorer);
                        const assistant = chooseWeightedPlayer(assistants, player => {
                            const roleWeight = { gk: 0.02, cb: 0.18, lb: 0.5, rb: 0.5, cm: 0.95, cam: 1.3, lw: 0.9, rw: 0.9, st: 0.5 }[player.role] || 0.4;
                            return roleWeight * (0.7 + (player.overall ?? 75) / 110);
                        });
                        assistant.assists++;
                        matchAssists.set(assistant, matchAssists.get(assistant) + 1);
                    }
                }
                let bestPlayer = null;
                let bestRating = -Infinity;
                allPlayers.forEach(player => {
                    const rating = 6.05 + Math.random() * 0.7
                        + matchGoals.get(player) * 0.9
                        + matchAssists.get(player) * 0.55
                        + (outcome === 'W' ? 0.3 : outcome === 'L' ? -0.12 : 0)
                        + (player.role === 'gk' && conceded === 0 ? 0.55 : 0);
                    player.ratingTotal += rating;
                    if (rating > bestRating) {
                        bestRating = rating;
                        bestPlayer = player;
                    }
                });
                if (bestPlayer) bestPlayer.playerOfMatch++;
                return bestPlayer;
            }

            function recentFormBoost(team) {
                if (!team.form.length) return 0;
                const recent = team.form.slice(-5);
                const averagePoints = recent.reduce((sum, points) => sum + points, 0) / recent.length;
                return (averagePoints - 1.25) * 0.075;
            }

            function applyMatchResult(home, away, homeGoals, awayGoals) {
                home.played++;
                away.played++;
                home.goalsFor += homeGoals;
                home.goalsAgainst += awayGoals;
                away.goalsFor += awayGoals;
                away.goalsAgainst += homeGoals;
                let homePoints = 1;
                let awayPoints = 1;
                if (homeGoals > awayGoals) {
                    home.wins++;
                    home.points += 3;
                    away.losses++;
                    homePoints = 3;
                    awayPoints = 0;
                } else if (awayGoals > homeGoals) {
                    away.wins++;
                    away.points += 3;
                    home.losses++;
                    homePoints = 0;
                    awayPoints = 3;
                } else {
                    home.draws++;
                    away.draws++;
                    home.points++;
                    away.points++;
                }
                home.form.push(homePoints);
                away.form.push(awayPoints);
            }

            function playMatchday(season, tacticKey) {
                if (season.round >= 38) return null;
                const tactic = TACTIC_PROFILES[tacticKey];
                const fixtures = season.schedule[season.round];
                let userFixture = null;
                fixtures.forEach(([homeId, awayId]) => {
                    const home = season.league.find(team => team.id === homeId);
                    const away = season.league.find(team => team.id === awayId);
                    const homeTactic = home.isUser ? tactic : TACTIC_PROFILES.balanced;
                    const awayTactic = away.isUser ? tactic : TACTIC_PROFILES.balanced;
                    const homeForm = recentFormBoost(home);
                    const awayForm = recentFormBoost(away);
                    const homeAttack = home.attack + homeTactic.attack + homeForm;
                    const awayAttack = away.attack + awayTactic.attack + awayForm;
                    const homeDefence = home.defence + homeTactic.defence + homeForm * 0.65;
                    const awayDefence = away.defence + awayTactic.defence + awayForm * 0.65;
                    const homeRatingEdge = clamp((home.rating - away.rating) * 0.03, -0.8, 0.8);
                    const awayRatingEdge = clamp((away.rating - home.rating) * 0.03, -0.8, 0.8);
                    const homeXg = clamp(1.3 + (homeAttack - awayDefence) * 0.18 + homeRatingEdge + 0.17 + (home.isUser ? 0.18 : 0) - (away.isUser ? 0.12 : 0), 0.18, 3.6);
                    const awayXg = clamp(1.08 + (awayAttack - homeDefence) * 0.18 + awayRatingEdge + (away.isUser ? 0.18 : 0) - (home.isUser ? 0.12 : 0), 0.18, 3.4);
                    const homeGoals = sampleGoals(homeXg);
                    const awayGoals = sampleGoals(awayXg);
                    applyMatchResult(home, away, homeGoals, awayGoals);
                    if (home.isUser || away.isUser) {
                        const isHome = home.isUser;
                        const userGoals = isHome ? homeGoals : awayGoals;
                        const conceded = isHome ? awayGoals : homeGoals;
                        const outcome = userGoals > conceded ? 'W' : userGoals < conceded ? 'L' : 'D';
                        const playerOfMatch = recordPlayerMatch(season, userGoals, conceded, outcome);
                        const homePossession = clamp(Math.round(50 + (home.midfield - away.midfield) * 3.1 + homeTactic.possession - awayTactic.possession + (Math.random() - 0.5) * 8), 30, 70);
                        const homeShots = Math.max(homeGoals, Math.round(homeXg * 3 + 2 + Math.random() * 5));
                        const awayShots = Math.max(awayGoals, Math.round(awayXg * 3 + 2 + Math.random() * 5));
                        userFixture = {
                            round: season.round + 1,
                            home: home.name,
                            away: away.name,
                            homeGoals,
                            awayGoals,
                            isHome,
                            userGoals,
                            conceded,
                            outcome,
                            tactic: tactic.label,
                            homeXg,
                            awayXg,
                            homeShots,
                            awayShots,
                            homePossession,
                            playerOfMatch: playerOfMatch?.name || 'La squadra'
                        };
                    }
                });
                season.round++;
                if (userFixture) season.userFixtures.push(userFixture);
                return userFixture;
            }

            function renderLiveStandings(season) {
                const standings = getLeagueOrder(season.league);
                const userPosition = standings.findIndex(team => team.isUser) + 1;
                const userTeam = standings[userPosition - 1];
                $('#live-position').textContent = `${userPosition}°`;
                $('#live-points').textContent = userTeam.points;
                $('#live-record').textContent = `${userTeam.wins}V · ${userTeam.draws}N · ${userTeam.losses}P`;
                $('#live-goals').textContent = `${userTeam.goalsFor} - ${userTeam.goalsAgainst}`;
                $('#standings-progress').textContent = `20 CLUB · ${season.round * 10} PARTITE`;
                $('#standings-final').innerHTML = `<table><thead><tr><th>POS</th><th>CLUB</th><th>PG</th><th>DR</th><th>PT</th></tr></thead><tbody>${standings.map((team, index) => `<tr${team.isUser ? ' class="user-standing"' : ''}><td>${index + 1}</td><td>${escapeHtml(team.name)}</td><td>${team.played}</td><td>${team.goalsFor - team.goalsAgainst}</td><td>${team.points}</td></tr>`).join('')}</tbody></table>`;
                return { standings, userPosition, userTeam };
            }

            function renderFixtureCard(season) {
                const finished = season.round >= 38;
                const fixtureRound = finished ? season.userFixtures[37] : season.schedule[season.round].find(([homeId, awayId]) => homeId === season.userTeamId || awayId === season.userTeamId);
                if (finished && fixtureRound) {
                    const fixture = fixtureRound;
                    $('#season-fixture').innerHTML = `<div class="fixture-kicker">ULTIMO RISULTATO · GIORNATA ${fixture.round}</div><div class="fixture-scoreboard"><div class="fixture-team"><small>${fixture.isHome ? 'IN CASA' : 'IN TRASFERTA'}</small><strong>${escapeHtml(fixture.home)}</strong><small>${fixture.isHome ? escapeHtml(season.teamName) : 'AVVERSARIO'}</small></div><div class="fixture-score">${fixture.homeGoals} - ${fixture.awayGoals}</div><div class="fixture-team"><small>${fixture.isHome ? 'AVVERSARIO' : 'IN CASA'}</small><strong>${escapeHtml(fixture.away)}</strong><small>${fixture.isHome ? 'TRASFERTA' : escapeHtml(season.teamName)}</small></div></div>`;
                    return;
                }
                const [homeId, awayId] = fixtureRound;
                const home = season.league.find(team => team.id === homeId);
                const away = season.league.find(team => team.id === awayId);
                const opponent = home.isUser ? away : home;
                const isHome = home.isUser;
                const lastFive = season.userFixtures.slice(-5).map(fixture => `<i class="${fixture.outcome === 'W' ? 'win' : fixture.outcome === 'D' ? 'draw' : 'loss'}" title="G${fixture.round}"></i>`).join('') || '<small>Nessuna partita giocata</small>';
                $('#season-fixture').innerHTML = `<div class="fixture-kicker">PROSSIMA · GIORNATA ${season.round + 1} · ${isHome ? 'IN CASA' : 'IN TRASFERTA'}</div><div class="fixture-scoreboard"><div class="fixture-team"><small>${isHome ? escapeHtml(userTeamName) : 'AVVERSARIO'}</small><strong>${escapeHtml(home.name)}</strong><small>ATT ${home.attack.toFixed(1)} · DIF ${home.defence.toFixed(1)}</small></div><div class="fixture-score">VS</div><div class="fixture-team"><small>${isHome ? 'AVVERSARIO' : escapeHtml(userTeamName)}</small><strong>${escapeHtml(away.name)}</strong><small>ATT ${away.attack.toFixed(1)} · DIF ${away.defence.toFixed(1)}</small></div></div><div class="fixture-form" aria-label="Ultimi cinque risultati">${lastFive}</div>`;
            }

            function renderPlayerSeasonStats(season) {
                const leaders = [...season.players].sort((a, b) => b.goals - a.goals || b.assists - a.assists || (b.ratingTotal / (b.appearances || 1)) - (a.ratingTotal / (a.appearances || 1))).slice(0, 4);
                $('#season-player-stats').innerHTML = leaders.map(player => `<div class="season-player-stat"><span>${player.name} · ${player.goals}G ${player.assists}A</span><strong>${player.appearances ? (player.ratingTotal / player.appearances).toFixed(1) : '--'}</strong></div>`).join('');
            }

            function renderMatchdayHistory(season) {
                $('#matchday-history').innerHTML = [...season.userFixtures].reverse().map(fixture => `<div class="match-sim user-result"><span class="match-round">G${fixture.round}</span><div class="team"><b>${fixture.home}</b><small>${fixture.isHome ? 'CASA' : 'TRASFERTA'}</small></div><div class="score">${fixture.homeGoals} - ${fixture.awayGoals}</div><div class="team"><b>${fixture.away}</b><small>${fixture.tactic} · ${fixture.homeShots + fixture.awayShots} TIRI</small></div></div>`).join('');
            }

            function renderSeasonDashboard(season, result = null) {
                if (!userTeamName && season.teamName) userTeamName = season.teamName;
                const { userPosition, userTeam } = renderLiveStandings(season);
                const finished = season.round >= 38;
                $('#matchday-message').className = 'matchday-message';
                $('#season-round').textContent = `${season.round} / 38`;
                $('#season-phase').textContent = finished ? 'CAMPIONATO CONCLUSO' : season.round ? `GIORNATA ${season.round} COMPLETATA` : 'PRONTO AL DEBUTTO';
                $('#season-progress').style.width = `${season.round / 38 * 100}%`;
                $('#tactic-balance').textContent = TACTIC_PROFILES[selectedTactic].label;
                renderFixtureCard(season);
                renderPlayerSeasonStats(season);
                renderMatchdayHistory(season);
                if (finished) {
                    const qualification = qualificationFor(userPosition);
                    const award = userPosition === 1 ? 'CAMPIONE D’ITALIA' : qualification ? `QUALIFICATA · ${qualification.name.toUpperCase()}` : userPosition >= 18 ? 'RETROCESSIONE' : 'STAGIONE COMPLETATA';
                    $('#matchday-message').innerHTML = `<strong>${award}</strong> · ${userTeamName}, ${userPosition}° con ${userTeam.points} punti. Sostituisci ${season.replacedClub}; ${qualification ? 'la tua squadra accede alla competizione europea indicata.' : userPosition >= 18 ? 'obiettivo: salvezza da riconquistare.' : 'nessuna coppa europea in questa simulazione.'}`;
                    $('#play-round-btn').textContent = 'CAMPIONATO CONCLUSO';
                    $('#play-round-btn').disabled = true;
                    $('#fast-sim-btn').style.display = 'none';
                    $('#tactic-controls').querySelectorAll('button').forEach(button => button.disabled = true);
                    $('#back-btn').style.display = 'inline-block';
                    $('#rebuild-team-btn').classList.remove('hidden');
                } else if (result) {
                    const outcomeTone = result.outcome === 'L' ? 'Scegli una nuova tattica e prepara la risposta.' : `${result.playerOfMatch} è il migliore in campo.`;
                    showMatchResult($('#matchday-message'), {
                        outcome: result.outcome,
                        kicker: `GIORNATA ${result.round} · ${result.tactic}`,
                        home: result.home,
                        away: result.away,
                        homeGoals: result.homeGoals,
                        awayGoals: result.awayGoals,
                        detail: `${outcomeTone} · xG ${result.homeXg.toFixed(1)} - ${result.awayXg.toFixed(1)} · possesso ${result.homePossession}% - ${100 - result.homePossession}%.`
                    });
                    $('#play-round-btn').textContent = `GIOCA LA GIORNATA ${season.round + 1}`;
                } else {
                    $('#matchday-message').textContent = `La tua squadra sostituisce ${season.replacedClub}. Scegli un approccio e gioca la prima giornata.`;
                    $('#play-round-btn').textContent = 'GIOCA LA GIORNATA 1';
                }
                if (finished && !season.europePopupShown && !season.europePopupPending) {
                    const revealSeasonEnd = () => {
                        season.europePopupPending = false;
                        if (season.europePopupShown) return;
                        if (userPosition === 1) showChampionReward(season);
                        else showSeasonQualification(season, userPosition);
                    };
                    if (result) {
                        season.europePopupPending = true;
                        window.setTimeout(revealSeasonEnd, 1450);
                    } else revealSeasonEnd();
                }
            }

            function qualificationFor(position) {
                if (position <= 5) return { key: 'champions', name: 'Champions League' };
                if (position === 6) return { key: 'europa', name: 'Europa League' };
                if (position === 7) return { key: 'conference', name: 'Conference League' };
                return null;
            }

            function openEuropeanModal({ kicker, title, copy, actionLabel, action, slots = '', mood = 'standard', accent = '#c6ff3d', momentLabel = 'FULL TIME', resultScore = '', opponent = '' }) {
                europeanModalAction = action;
                $('#europe-modal').classList.remove('modal-standard', 'modal-elimination', 'modal-champion');
                $('#europe-modal').classList.add(`modal-${mood}`);
                $('#europe-modal-panel').style.setProperty('--modal-accent', accent);
                $('#europe-modal-kicker').textContent = kicker;
                $('#europe-modal-title').textContent = title;
                $('#europe-modal-copy').textContent = copy;
                $('#europe-modal-art-symbol').textContent = mood === 'champion' ? '★' : mood === 'elimination' ? '×' : '•';
                $('#europe-modal-art-label').textContent = momentLabel;
                $('#europe-modal-art-score').textContent = resultScore;
                $('#europe-modal-art-opponent').textContent = opponent;
                $('#europe-slots').innerHTML = slots;
                $('#europe-modal-action').textContent = actionLabel;
                $('#europe-modal').classList.remove('hidden');
                $('#europe-modal-action').focus();
            }

            function closeEuropeanModal() {
                $('#europe-modal').classList.add('hidden');
            }

            function qualificationCards(activeKey) {
                return [
                    ['champions', 'CHAMPIONS LEAGUE', '1°-5°', '#d7b85a'],
                    ['europa', 'EUROPA LEAGUE', '6°', '#f08d3c'],
                    ['conference', 'CONFERENCE LEAGUE', '7°', '#67c77c'],
                    ['none', 'NESSUNA COPPA', '8°-20°', '#7b827d']
                ].map(([key, name, places, color]) => `<div class="europe-slot${key === activeKey ? ' qualified' : ''}" style="--slot-color:${color}"><b>${name}</b><span>${places}</span></div>`).join('');
            }

            function showSeasonQualification(season, position) {
                const qualification = qualificationFor(position);
                season.europeQualification = qualification;
                season.europePopupShown = true;
                $('#europe-reopen-btn').classList.remove('hidden');
                $('#new-team-btn').classList.remove('hidden');
                openEuropeanModal({
                    kicker: 'SERIE A · STAGIONE CONCLUSA',
                    title: qualification ? `PASS PER ${qualification.name.toUpperCase()}` : 'STAGIONE COMPLETATA',
                    copy: qualification
                        ? `Il ${position}° posto vale l'accesso alla ${qualification.name}. La coppa inizia con una classifica unica da 36 squadre. Assegnazione semplificata: non sono simulati Coppa Italia e ribilanciamenti UEFA.`
                        : `Il ${position}° posto non assegna una coppa europea in questa simulazione. Puoi comunque rivedere la stagione e la classifica finale. Le qualificazioni sono semplificate.`,
                    actionLabel: qualification ? `GIOCA LA ${qualification.name.toUpperCase()}` : 'RIVEDI LA STAGIONE',
                    action: activeEuropeanCompetition ? 'resume-europe' : qualification ? 'start-phase' : 'return-season',
                    slots: qualificationCards(qualification?.key || 'none')
                });
            }

            function renderLegendChoices(season) {
                $('#new-team-btn').classList.remove('hidden');
                const lineup = Object.entries(userLineup)
                    .sort(([, first], [, second]) => (first.overall ?? 75) - (second.overall ?? 75))
                    .map(([slotId, player]) => `<div class="legend-starter${(player.overall ?? 75) <= 75 ? ' weakest' : ''}"><span><b>${escapeHtml(player.name)}</b><small>${ROLE_SHORT[player.role] || player.role.toUpperCase()}</small></span><strong>${player.overall ?? 75}</strong></div>`)
                    .join('');
                const cards = LEGEND_REWARDS.map(legend => {
                    const compatible = Object.values(userLineup).some(player => getCompatibleSlotRoles([legend.role]).includes(player.role));
                    const owned = Object.values(userLineup).some(player => player.legendId === legend.id);
                    const disabled = !compatible || owned;
                    return `<button class="legend-choice" type="button" data-legend="${legend.id}"${disabled ? ' disabled' : ''}><span class="legend-choice-rating">${legend.overall}</span><span class="legend-choice-mark">ICONA</span><b>${legend.name}</b><small>${ROLE_NAMES[legend.role]}${legend.note ? ` · ${legend.note}` : ''}</small>${owned ? '<em>GIÀ IN ROSA</em>' : ''}</button>`;
                }).join('');
                openEuropeanModal({
                    kicker: 'CAMPIONE D’ITALIA · PREMIO SPECIALE',
                    title: 'SCEGLI LA TUA ICONA',
                    copy: 'Confronta le Icone con i tuoi titolari e scegli quale ruolo potenziare.',
                    actionLabel: 'SALTA IL PREMIO',
                    action: 'skip-legend',
                    slots: `<div class="legend-selection-layout"><div class="legend-starters"><div class="legend-panel-label">LA TUA FORMAZIONE · DAL PIÙ DEBOLE</div>${lineup}</div><div class="legend-options"><div class="legend-panel-label">SCEGLI L’ICONA</div>${cards}</div></div>`
                });
                pendingLegendSeason = season;
            }

            function renderLegendReplacement(legend) {
                selectedLegendReward = legend;
                const replacements = Object.entries(userLineup).filter(([, player]) => getCompatibleSlotRoles([legend.role]).includes(player.role));
                const choices = replacements.map(([slotId, player]) => `<button class="legend-player-choice" type="button" data-legend-slot="${slotId}"><span><b>${player.name}</b><small>${ROLE_NAMES[player.role]} · OVR ${player.overall ?? '--'}</small></span><strong>SOSTITUISCI</strong></button>`).join('');
                openEuropeanModal({
                    kicker: `PREMIO ICONA · ${ROLE_NAMES[legend.role].toUpperCase()}`,
                    title: `${legend.name.toUpperCase()} IN ROSA`,
                    copy: `Scegli quale titolare ${ROLE_NAMES[legend.role].toLowerCase()} sostituire. Il cambio è immediato e non modifica il risultato del campionato appena concluso.`,
                    actionLabel: 'INDIETRO ALLE ICONE',
                    action: 'legend-back',
                    slots: choices
                });
            }

            function awardLegendToStarter(slotId) {
                const season = pendingLegendSeason;
                const legend = selectedLegendReward;
                const starter = userLineup[slotId];
                if (!season || !legend || !starter || starter.role !== legend.role) return;
                const replacement = {
                    ...starter,
                    name: legend.name,
                    overall: legend.overall,
                    role: starter.role,
                    roles: [starter.role],
                    legendId: legend.id,
                    isLegend: true
                };
                userLineup[slotId] = replacement;
                const seasonPlayer = season.players.find(player => player.slotId === slotId);
                if (seasonPlayer) Object.assign(seasonPlayer, replacement);
                season.legendRewardClaimed = true;
                selectedLegendReward = null;
                pendingLegendSeason = null;
                renderFormation();
                showSeasonQualification(season, 1);
            }

            function showChampionReward(season) {
                season.championRewardShown = true;
                season.europePopupShown = true;
                renderLegendChoices(season);
            }

            function europeanOrder(clubs) {
                return [...clubs].sort((a, b) => b.points - a.points
                    || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
                    || b.goalsFor - a.goalsFor
                    || b.strength - a.strength);
            }

            function createEuropeanCompetition() {
                const qualification = activeSeason.europeQualification;
                const details = EUROPEAN_DETAILS[qualification.key];
                const playerRating = activeSeason.players.reduce((sum, player) => sum + (player.overall ?? 75), 0) / activeSeason.players.length;
                const names = EUROPEAN_POOLS[qualification.key].filter((name, index, all) => all.indexOf(name) === index).slice(0, 35);
                const clubs = [{ id: 0, name: userTeamName, strength: playerRating, isUser: true }].concat(names.map((name, index) => {
                    const hash = [...name].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
                    return { id: index + 1, name, strength: 68 + hash % 21, isUser: false };
                })).map(club => ({ ...club, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
                let rotation = clubs.map(club => club.id);
                const schedule = [];
                for (let round = 0; round < 35; round++) {
                    const fixtures = [];
                    for (let index = 0; index < rotation.length / 2; index++) fixtures.push([rotation[index], rotation[rotation.length - 1 - index]]);
                    const userFixture = fixtures.findIndex(([home, away]) => home === 0 || away === 0);
                    const shouldHost = round % 2 === 0;
                    if ((fixtures[userFixture][0] === 0) !== shouldHost) fixtures[userFixture].reverse();
                    schedule.push(fixtures);
                    rotation = [rotation[0], rotation[rotation.length - 1], ...rotation.slice(1, -1)];
                }
                return {
                    key: qualification.key,
                    name: details.name,
                    color: details.color,
                    totalRounds: details.matches,
                    clubs,
                    schedule,
                    round: 0,
                    mode: 'league',
                    history: [],
                    message: 'Scegli l’approccio tattico e gioca la prima partita.',
                    faced: new Set(),
                    knockoutStages: [],
                    knockoutIndex: 0,
                    knockoutOpponent: null,
                    leaguePosition: null,
                    completed: false,
                    champion: false
                };
            }

            function renderEuropeanCompetition() {
                const competition = activeEuropeanCompetition;
                if (!competition) return;
                const standings = europeanOrder(competition.clubs);
                const position = standings.findIndex(club => club.isUser) + 1;
                const phaseDone = competition.round >= competition.totalRounds;
                const knockout = competition.mode === 'knockout';
                const finished = competition.mode === 'finished';
                const stageNames = competition.knockoutStages;
                const stageName = knockout ? stageNames[competition.knockoutIndex] : 'FASE CAMPIONATO';
                $('#europe-mode').style.setProperty('--europe-color', competition.color);
                $('#europe-title').textContent = competition.name.toUpperCase();
                $('#europe-format').textContent = `${competition.totalRounds} partite · classifica unica a 36 · avversarie indicative e risultati simulati, non feed UEFA ufficiale · eliminazione in gara secca`;
                $('#europe-tactic-label').textContent = TACTIC_PROFILES[selectedTactic].label;
                $$('#europe-tactics .tactic-btn').forEach(button => {
                    const selected = button.dataset.europeTactic === selectedTactic;
                    button.classList.toggle('active', selected);
                    button.setAttribute('aria-pressed', String(selected));
                });
                $('#europe-kicker').textContent = knockout ? `UEFA · ${stageName.toUpperCase()}` : 'UEFA · FASE CAMPIONATO';
                $('#europe-stage').textContent = finished ? 'COMPETIZIONE CONCLUSA' : knockout ? stageName.toUpperCase() : phaseDone ? 'FASE CAMPIONATO COMPLETATA' : 'FASE CAMPIONATO';
                $('#europe-round').textContent = knockout ? `${competition.knockoutIndex + 1} / ${stageNames.length}` : `${competition.round} / ${competition.totalRounds}`;
                $('#europe-progress').style.width = knockout ? `${(competition.knockoutIndex / stageNames.length) * 100}%` : `${(competition.round / competition.totalRounds) * 100}%`;
                $('#europe-venue').textContent = `${Math.ceil(competition.totalRounds / 2)} CASA · ${Math.floor(competition.totalRounds / 2)} TRASFERTA`;
                $('#europe-table-progress').textContent = `${competition.round * 18} PARTITE GIOCATE`;
                const leagueFixture = !phaseDone && !knockout && !finished
                    ? competition.schedule[competition.round].find(([home, away]) => home === 0 || away === 0)
                    : null;
                const opponent = leagueFixture
                    ? competition.clubs[leagueFixture[0] === 0 ? leagueFixture[1] : leagueFixture[0]]
                    : competition.knockoutOpponent;
                const userHome = leagueFixture ? leagueFixture[0] === 0 : true;
                $('#europe-fixture').innerHTML = opponent && !finished
                    ? `<div class="fixture-kicker">${knockout ? 'GARA SECCA · CAMPO NEUTRO' : `GIORNATA ${competition.round + 1} · ${userHome ? 'IN CASA' : 'TRASFERTA'}`}</div><div class="fixture-scoreboard"><div class="fixture-team"><small>${knockout ? userTeamName : userHome ? userTeamName : 'AVVERSARIA'}</small><strong>${userHome ? userTeamName : opponent.name}</strong></div><div class="fixture-score">VS</div><div class="fixture-team"><small>${knockout ? 'AVVERSARIA' : userHome ? 'AVVERSARIA' : userTeamName}</small><strong>${userHome ? opponent.name : userTeamName}</strong></div></div>`
                    : `<div class="europe-empty">${finished ? (competition.champion ? 'CAMPIONI D’EUROPA' : 'PERCORSO EUROPEO CONCLUSO') : 'La fase campionato è terminata.'}</div>`;
                $('#europe-message').className = 'matchday-message';
                $('#europe-message').textContent = competition.message;
                $('#europe-play-btn').disabled = (phaseDone && !knockout) || finished;
                $('#europe-play-btn').textContent = knockout ? `GIOCA ${stageName.toUpperCase()}` : phaseDone ? 'FASE CAMPIONATO CONCLUSA' : `GIOCA LA GIORNATA ${competition.round + 1}`;
                $('#europe-return-btn').classList.toggle('hidden', !phaseDone && !finished);
                $('#europe-standings').innerHTML = `<table><thead><tr><th>POS</th><th>CLUB</th><th>PG</th><th>DR</th><th>PT</th></tr></thead><tbody>${standings.map((club, index) => `<tr class="${club.isUser ? 'user-standing' : index < 8 ? 'europe-direct' : index < 24 ? 'europe-playoff' : 'europe-out'}"><td>${index + 1}</td><td>${club.name}</td><td>${club.played}</td><td>${club.goalsFor - club.goalsAgainst}</td><td>${club.points}</td></tr>`).join('')}</tbody></table>`;
                $('#europe-history').innerHTML = competition.history.slice(-5).reverse().map(item => `<div class="europe-history-row"><span>${item.round}</span><b>${item.opponent}</b><strong>${item.score}</strong><small>${item.result}</small></div>`).join('');
                $('#europe-return-btn').classList.toggle('hidden', !(phaseDone || finished));
                if (phaseDone && competition.mode === 'leagueComplete') $('#europe-return-btn').classList.remove('hidden');
                $('#europe-mode').dataset.position = String(position);
            }

            function drawKnockoutOpponent(competition, stage) {
                const standings = europeanOrder(competition.clubs);
                const position = competition.leaguePosition;
                let candidates;
                if (stage === 'Playoff') candidates = position <= 16 ? standings.slice(16, 24) : standings.slice(8, 16);
                else if (stage === 'Ottavi') candidates = position <= 8 ? standings.slice(8, 24) : standings.slice(0, 8);
                else candidates = standings.slice(0, 24);
                candidates = candidates.filter(club => !club.isUser && !competition.faced.has(club.id));
                if (!candidates.length) candidates = standings.filter(club => !club.isUser && !competition.faced.has(club.id));
                const opponent = candidates[Math.floor(Math.random() * candidates.length)];
                competition.knockoutOpponent = opponent;
                if (opponent) competition.faced.add(opponent.id);
            }

            function startEuropeanPhase() {
                if (!activeEuropeanCompetition) activeEuropeanCompetition = createEuropeanCompetition();
                $('#season-kpis').classList.add('hidden');
                $('#season-dashboard').classList.add('hidden');
                $('#round-results').classList.add('hidden');
                $('#back-btn').classList.add('hidden');
                $('#europe-mode').classList.remove('hidden');
                renderEuropeanCompetition();
            }

            function startEuropeanKnockout() {
                const competition = activeEuropeanCompetition;
                if (!competition || !competition.knockoutStages.length) return;
                competition.mode = 'knockout';
                competition.knockoutIndex = 0;
                drawKnockoutOpponent(competition, competition.knockoutStages[0]);
                competition.message = `La fase campionato ti ha assegnato il ${competition.leaguePosition}° posto. Ora si gioca a eliminazione diretta.`;
                startEuropeanPhase();
            }

            function finishEuropeanPhase() {
                const competition = activeEuropeanCompetition;
                const position = europeanOrder(competition.clubs).findIndex(club => club.isUser) + 1;
                competition.leaguePosition = position;
                competition.mode = 'leagueComplete';
                const nextStage = position <= 8 ? 'Ottavi' : position <= 24 ? 'Playoff' : null;
                competition.knockoutStages = position <= 8
                    ? ['Ottavi', 'Quarti', 'Semifinali', 'Finale']
                    : position <= 24 ? ['Playoff', 'Ottavi', 'Quarti', 'Semifinali', 'Finale'] : [];
                competition.message = nextStage
                    ? `Hai chiuso al ${position}° posto: ${position <= 8 ? 'accesso diretto agli ottavi.' : 'si passa dai playoff.'}`
                    : `Hai chiuso al ${position}° posto: dal 25° in giù si è eliminati, senza retrocessione nella coppa inferiore.`;
                renderEuropeanCompetition();
                openEuropeanModal({
                    kicker: `${competition.name.toUpperCase()} · FASE CAMPIONATO`,
                    title: nextStage ? `${position}° POSTO · ${nextStage.toUpperCase()}` : `${position}° POSTO · ELIMINATI`,
                    copy: nextStage
                        ? position <= 8 ? 'Tra le prime otto: vai direttamente agli ottavi. Le coppe inferiori non entrano in gioco.' : 'Dal 9° al 24° posto si disputa il playoff. Chi viene eliminato non scende in Europa League o Conference League.'
                        : 'Il piazzamento oltre il 24° posto chiude il percorso europeo. Nel formato attuale non c’è retrocessione nella competizione inferiore.',
                    actionLabel: nextStage ? nextStage === 'Ottavi' ? 'VAI AGLI OTTAVI' : `VAI AI ${nextStage.toUpperCase()}` : 'TORNA ALLA STAGIONE',
                    action: nextStage ? 'start-knockout' : 'return-season',
                    slots: `<div class="europe-slot${position <= 8 ? ' qualified' : ''}" style="--slot-color:${competition.color}"><b>1°-8°</b><span>OTTAVI DIRETTI</span></div><div class="europe-slot${position >= 9 && position <= 24 ? ' qualified' : ''}" style="--slot-color:${competition.color}"><b>9°-24°</b><span>PLAYOFF</span></div><div class="europe-slot${position >= 25 ? ' qualified' : ''}" style="--slot-color:#7b827d"><b>25°-36°</b><span>ELIMINAZIONE</span></div>`
                });
            }

            function finishEuropeanKnockout(won) {
                const competition = activeEuropeanCompetition;
                const stage = competition.knockoutStages[competition.knockoutIndex];
                if (won && competition.knockoutIndex < competition.knockoutStages.length - 1) {
                    competition.knockoutIndex++;
                    const nextStage = competition.knockoutStages[competition.knockoutIndex];
                    drawKnockoutOpponent(competition, nextStage);
                    const nextStageLabel = { Playoff: 'ai playoff', Ottavi: 'agli ottavi', Quarti: 'ai quarti', Semifinali: 'alle semifinali', Finale: 'alla finale' }[nextStage];
                    competition.message = `Turno superato: si va ${nextStageLabel}.`;
                    renderEuropeanCompetition();
                    return;
                }
                competition.mode = 'finished';
                competition.completed = true;
                competition.champion = won && stage === 'Finale';
                competition.message = competition.champion ? 'Una stagione europea da ricordare: la coppa è tua.' : 'Il percorso europeo termina qui.';
                renderEuropeanCompetition();
                const finalMatch = competition.history.at(-1);
                window.setTimeout(() => openEuropeanModal({
                    kicker: `${competition.name.toUpperCase()} · ${stage.toUpperCase()}`,
                    title: competition.champion ? 'CAMPIONI D’EUROPA' : 'PERCORSO CONCLUSO',
                    copy: competition.champion ? 'La tua squadra ha vinto la competizione europea.' : `La tua squadra è stata eliminata ai ${stage.toLowerCase()}.`,
                    actionLabel: 'TORNA ALLA STAGIONE',
                    action: 'return-season',
                    mood: competition.champion ? 'champion' : 'elimination',
                    accent: competition.color,
                    momentLabel: competition.champion ? 'CAMPIONI' : `FINE · ${stage.toUpperCase()}`,
                    resultScore: finalMatch?.score || '',
                    opponent: finalMatch?.opponent || ''
                }), 1450);
            }

            function playEuropeanMatch() {
                const competition = activeEuropeanCompetition;
                if (!competition) return;
                const tactic = TACTIC_PROFILES[selectedTactic];
                if (competition.mode === 'league') {
                    const fixtures = competition.schedule[competition.round];
                    let userResult = null;
                    fixtures.forEach(([homeId, awayId]) => {
                        const home = competition.clubs[homeId];
                        const away = competition.clubs[awayId];
                        const homeIsUser = home.isUser;
                        const awayIsUser = away.isUser;
                        const homeXg = clamp(1.28 + (home.strength - away.strength) * 0.055 + (homeIsUser ? tactic.attack * 0.42 : 0) + (awayIsUser ? -tactic.defence * 0.3 : 0) + 0.12, 0.25, 3.4);
                        const awayXg = clamp(1.08 + (away.strength - home.strength) * 0.052 + (awayIsUser ? tactic.attack * 0.42 : 0) + (homeIsUser ? -tactic.defence * 0.3 : 0), 0.2, 3.2);
                        const homeGoals = sampleGoals(homeXg);
                        const awayGoals = sampleGoals(awayXg);
                        home.played++; away.played++;
                        home.goalsFor += homeGoals; home.goalsAgainst += awayGoals;
                        away.goalsFor += awayGoals; away.goalsAgainst += homeGoals;
                        if (homeGoals > awayGoals) { home.wins++; home.points += 3; away.losses++; }
                        else if (awayGoals > homeGoals) { away.wins++; away.points += 3; home.losses++; }
                        else { home.draws++; away.draws++; home.points++; away.points++; }
                        if (homeIsUser || awayIsUser) {
                            const userGoals = homeIsUser ? homeGoals : awayGoals;
                            const rivalGoals = homeIsUser ? awayGoals : homeGoals;
                            userResult = {
                                opponent: homeIsUser ? away.name : home.name,
                                score: `${userGoals} - ${rivalGoals}`,
                                result: userGoals > rivalGoals ? 'VITTORIA' : userGoals < rivalGoals ? 'SCONFITTA' : 'PAREGGIO',
                                outcome: userGoals > rivalGoals ? 'W' : userGoals < rivalGoals ? 'L' : 'D',
                                home: home.name,
                                away: away.name,
                                homeGoals,
                                awayGoals
                            };
                        }
                    });
                    competition.round++;
                    competition.history.push({ round: `G${competition.round}`, ...userResult });
                    competition.message = `${userResult.result}: ${userResult.opponent} ${userResult.score}.`;
                    renderEuropeanCompetition();
                    showMatchResult($('#europe-message'), {
                        outcome: userResult.outcome,
                        kicker: `${competition.name.toUpperCase()} · GIORNATA ${competition.round}`,
                        home: userResult.home,
                        away: userResult.away,
                        homeGoals: userResult.homeGoals,
                        awayGoals: userResult.awayGoals,
                        detail: userResult.result === 'VITTORIA' ? 'Tre punti europei. La classifica si muove.' : userResult.result === 'SCONFITTA' ? 'Serata amara. La prossima partita è già una risposta.' : 'Un punto a testa nella fase campionato.'
                    });
                    if (competition.round >= competition.totalRounds) window.setTimeout(finishEuropeanPhase, 1450);
                    return;
                }
                if (competition.mode !== 'knockout' || !competition.knockoutOpponent) return;
                const opponent = competition.knockoutOpponent;
                const user = competition.clubs[0];
                const userGoals = sampleGoals(clamp(1.35 + (user.strength - opponent.strength) * 0.055 + tactic.attack * 0.38 - tactic.defence * 0.12, 0.2, 3.6));
                const rivalGoals = sampleGoals(clamp(1.2 + (opponent.strength - user.strength) * 0.052 - tactic.defence * 0.28, 0.2, 3.4));
                const wonOnPens = userGoals === rivalGoals && Math.random() < clamp(0.5 + (user.strength - opponent.strength) / 70 + tactic.attack * 0.05, 0.25, 0.75);
                const won = userGoals > rivalGoals || (userGoals === rivalGoals && wonOnPens);
                const playedStage = competition.knockoutStages[competition.knockoutIndex];
                const score = `${userGoals} - ${rivalGoals}${userGoals === rivalGoals ? (won ? ' (5-4 rig.)' : ' (4-5 rig.)') : ''}`;
                competition.history.push({ round: playedStage, opponent: opponent.name, score, result: won ? 'PASSAGGIO' : 'ELIMINAZIONE' });
                competition.message = `${won ? 'VITTORIA' : 'SCONFITTA'} contro ${opponent.name}: ${score}.`;
                finishEuropeanKnockout(won);
                showMatchResult($('#europe-message'), {
                    outcome: won ? 'W' : 'L',
                    kicker: `${competition.name.toUpperCase()} · ${playedStage}`,
                    home: userTeamName,
                    away: opponent.name,
                    homeGoals: userGoals,
                    awayGoals: rivalGoals,
                    detail: userGoals === rivalGoals ? `${won ? 'Passaggio ai rigori.' : 'Eliminazione ai rigori.'} ${score}` : won ? 'Qualificazione conquistata. Avanti al prossimo turno.' : 'Il percorso europeo si ferma qui.'
                });
            }

            function returnToDomesticSeason() {
                closeEuropeanModal();
                $('#europe-mode').classList.add('hidden');
                $('#season-kpis').classList.remove('hidden');
                $('#season-dashboard').classList.remove('hidden');
                $('#round-results').classList.remove('hidden');
                $('#back-btn').classList.remove('hidden');
                $('#rebuild-team-btn').classList.add('hidden');
            }

            function startNewTeam() {
                closeEuropeanModal();
                activeSeason = null;
                activeEuropeanCompetition = null;
                pendingLegendSeason = null;
                selectedLegendReward = null;
                $('#new-team-btn').classList.add('hidden');
                $('#simul').classList.remove('active');
                document.body.style.overflow = '';
                openFormationBuilder();
            }

            $('#europe-modal-action').addEventListener('click', () => {
                const action = europeanModalAction;
                closeEuropeanModal();
                if (action === 'start-phase') startEuropeanPhase();
                else if (action === 'start-knockout') startEuropeanKnockout();
                else if (action === 'resume-europe') startEuropeanPhase();
                else if (action === 'return-season') returnToDomesticSeason();
                else if (action === 'skip-legend' && pendingLegendSeason) {
                    const season = pendingLegendSeason;
                    pendingLegendSeason = null;
                    showSeasonQualification(season, 1);
                } else if (action === 'legend-back' && pendingLegendSeason) renderLegendChoices(pendingLegendSeason);
            });
            $('#new-team-btn').addEventListener('click', startNewTeam);
            $('#europe-modal-close').addEventListener('click', () => {
                const action = europeanModalAction;
                closeEuropeanModal();
                if (action === 'start-knockout') startEuropeanKnockout();
                else if (action === 'skip-legend' || action === 'legend-back') {
                    const season = pendingLegendSeason;
                    pendingLegendSeason = null;
                    if (season) showSeasonQualification(season, 1);
                }
            });
            $('#europe-slots').addEventListener('click', event => {
                const iconButton = event.target.closest('[data-legend]');
                if (iconButton && europeanModalAction === 'skip-legend') {
                    const legend = LEGEND_REWARDS.find(item => item.id === iconButton.dataset.legend);
                    if (legend && !iconButton.disabled) renderLegendReplacement(legend);
                    return;
                }
                const starterButton = event.target.closest('[data-legend-slot]');
                if (starterButton && europeanModalAction === 'legend-back') awardLegendToStarter(starterButton.dataset.legendSlot);
            });
            $('#europe-reopen-btn').addEventListener('click', () => {
                if (activeSeason?.europeQualification) showSeasonQualification(activeSeason, europeanOrder(activeSeason.league).findIndex(team => team.isUser) + 1);
            });
            $('#europe-play-btn').addEventListener('click', playEuropeanMatch);
            $('#europe-return-btn').addEventListener('click', returnToDomesticSeason);
            $('#europe-tactics').addEventListener('click', event => {
                const button = event.target.closest('[data-europe-tactic]');
                if (!button) return;
                selectedTactic = button.dataset.europeTactic;
                $$('#europe-tactics .tactic-btn').forEach(option => {
                    const selected = option === button;
                    option.classList.toggle('active', selected);
                    option.setAttribute('aria-pressed', String(selected));
                });
                $('#europe-tactic-label').textContent = TACTIC_PROFILES[selectedTactic].label;
            });

            function playNextMatchday() {
                if (!activeSeason || activeSeason.round >= 38) return;
                const result = playMatchday(activeSeason, selectedTactic);
                renderSeasonDashboard(activeSeason, result);
            }

            function simulateRemainingSeason() {
                if (!activeSeason || activeSeason.round >= 38) return;
                let finalResult = null;
                while (activeSeason.round < 38) finalResult = playMatchday(activeSeason, selectedTactic);
                renderSeasonDashboard(activeSeason, finalResult);
            }

            function startSeasonSimulation() {
                if (Object.keys(userLineup).length !== 11) return;
                closeFormationBuilder({ reset: false });
                activeEuropeanCompetition = null;
                $('#europe-reopen-btn').classList.add('hidden');
                $('#europe-mode').classList.add('hidden');
                $('#season-kpis').classList.remove('hidden');
                $('#season-dashboard').classList.remove('hidden');
                $('#round-results').classList.remove('hidden');
                $('#back-btn').classList.remove('hidden');
                $('#rebuild-team-btn').classList.add('hidden');
                $('#new-team-btn').classList.add('hidden');
                activeSeason = createSeasonSimulation();
                selectedTactic = 'balanced';
                $$('#tactic-controls .tactic-btn').forEach(button => {
                    const selected = button.dataset.tactic === selectedTactic;
                    button.classList.toggle('active', selected);
                    button.setAttribute('aria-pressed', String(selected));
                    button.disabled = false;
                });
                $('#simul').classList.add('active');
                document.body.style.overflow = 'hidden';
                $('#simul-loading').style.display = 'none';
                $('#simul-results').style.display = 'block';
                $('#simul-squad-info').textContent = `${userTeamName.toUpperCase()} · ${currentFormation} · 38 GIORNATE · 20 CLUB`;
                $('#round-results').style.display = 'block';
                $('#back-btn').style.display = 'none';
                $('#play-round-btn').disabled = false;
                $('#fast-sim-btn').style.display = 'block';
                renderSeasonDashboard(activeSeason);
            }

            $('#tactic-controls').addEventListener('click', event => {
                const button = event.target.closest('[data-tactic]');
                if (!button || button.disabled || !activeSeason || activeSeason.round >= 38) return;
                selectedTactic = button.dataset.tactic;
                $$('#tactic-controls .tactic-btn').forEach(option => {
                    const selected = option === button;
                    option.classList.toggle('active', selected);
                    option.setAttribute('aria-pressed', String(selected));
                });
                $('#tactic-balance').textContent = TACTIC_PROFILES[selectedTactic].label;
                const tacticalMessage = {
                    defensive: 'Blocco basso e ripartenze: più copertura, meno uomini in area.',
                    balanced: 'Squadra compatta: equilibrio tra possesso, protezione e attacco.',
                    attacking: 'Pressing alto e tanti uomini avanti: più occasioni, più spazi concessi.'
                };
                $('#matchday-message').textContent = tacticalMessage[selectedTactic];
            });

            $('#play-round-btn').addEventListener('click', playNextMatchday);
            $('#fast-sim-btn').addEventListener('click', simulateRemainingSeason);
            $('#play-btn').addEventListener('click', startSeasonSimulation);
            $('#start-season-btn').addEventListener('click', startSeasonSimulation);
            $('#simul-close').addEventListener('click', () => {
                $('#simul').classList.remove('active');
                document.body.style.overflow = '';
            });
            $('#back-btn').addEventListener('click', () => {
                $('#simul').classList.remove('active');
                document.body.style.overflow = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            $('#rebuild-team-btn').addEventListener('click', () => {
                $('#simul').classList.remove('active');
                document.body.style.overflow = '';
                openFormationBuilder();
                const activeModule = document.querySelector('.mod-btn.active') || document.querySelector('.mod-btn[data-mod="4-3-3"]');
                activeModule?.click();
            });
        });
;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const escapeDraftHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

        console.log('Script loaded');

        // apertura builder squadra
        const formaLink = $('#forma-link');
        if (formaLink) {
            formaLink.addEventListener('click', e => {
                e.preventDefault();
                openFormationBuilder();
            });
        }

        /* ---- DATI REALI ---- */
        const T = [["Atalanta", "Bergamo", "Gewiss Stadium", "#1e71b8", "#111", 7], ["Bologna", "Bologna", "Renato Dall'Ara", "#a8192e", "#14305f", 5], ["Cagliari", "Cagliari", "Unipol Domus", "#a41e35", "#14305f", 2], ["Como", "Como", "Giuseppe Sinigaglia", "#1b5aa7", "#fff", 3], ["Frosinone", "Frosinone", "Benito Stirpe", "#f2c500", "#14305f", 2], ["Fiorentina", "Firenze", "Artemio Franchi", "#6a2f9e", "#fff", 4], ["Genoa", "Genova", "Luigi Ferraris", "#a31c2c", "#14305f", 3], ["Inter", "Milano", "San Siro", "#0a3a8a", "#000", 9], ["Juventus", "Torino", "Allianz Stadium", "#e9e9e9", "#000", 9], ["Lazio", "Roma", "Olimpico", "#87c5ec", "#fff", 6], ["Lecce", "Lecce", "Via del Mare", "#f2c500", "#c8102e", 2], ["Milan", "Milano", "San Siro", "#c8102e", "#000", 8], ["Napoli", "Napoli", "Diego Armando Maradona", "#12a0d7", "#fff", 8], ["Parma", "Parma", "Ennio Tardini", "#f2c500", "#14305f", 3], ["Monza", "Monza", "U-Power Stadium", "#c8102e", "#fff", 2], ["Roma", "Roma", "Olimpico", "#8e1f2f", "#f2a900", 6], ["Sassuolo", "Sassuolo", "Mapei Stadium", "#0a8a4a", "#000", 3], ["Torino", "Torino", "Olimpico Grande Torino", "#7a1f1f", "#fff", 3], ["Udinese", "Udine", "Bluenergy Stadium", "#cfcfcf", "#000", 3], ["Venezia", "Venezia", "Pier Luigi Penzo", "#0a7a4a", "#e8731c", 1]];

        const ABB = { ATA: 0, BFC: 1, CAG: 2, COM: 3, FRO: 4, FIO: 5, GEN: 6, INT: 7, JUV: 8, LAZ: 9, LEC: 10, ACM: 11, NAP: 12, PAR: 13, MON: 14, ROM: 15, SAS: 16, TOR: 17, UDI: 18, VEN: 19 };

        const DAY = 5, ini = n => n.slice(0, 3).toUpperCase();

        const mk = a => a.map(([h, w, x, y, d, p]) => [ABB[h], ABB[w], x, y, new Date(d + ':00+02:00'), p]);

        const R = {
            4: mk([["MON", "SAS", 2, 1, "2026-09-18T20:45"], ["BFC", "TOR", 1, 1, "2026-09-19T15:00"], ["UDI", "CAG", 0, 1, "2026-09-19T15:00"], ["ROM", "INT", 2, 2, "2026-09-19T18:00"], ["VEN", "LAZ", 0, 2, "2026-09-19T20:45"], ["FIO", "NAP", 1, 1, "2026-09-20T12:30"], ["FRO", "COM", 2, 0, "2026-09-20T15:00"], ["PAR", "GEN", 2, 1, "2026-09-20T15:00"], ["JUV", "ATA", 2, 0, "2026-09-20T18:00"], ["ACM", "LEC", 3, 0, "2026-09-20T20:45"]]),
            5: mk([["GEN", "FIO", null, null, "2026-10-10T15:00", [30.4, 28.8, 40.8]], ["INT", "PAR", null, null, "2026-10-10T18:00", [84.5, 10.1, 5.4]], ["NAP", "FRO", null, null, "2026-10-10T20:45", [67.3, 18.3, 14.4]], ["COM", "ROM", null, null, "2026-10-11T12:30", [37.7, 26.4, 35.9]], ["LAZ", "MON", null, null, "2026-10-11T15:00", [61.3, 22.8, 15.9]], ["LEC", "BFC", null, null, "2026-10-11T15:00", [23, 28.1, 48.9]], ["SAS", "ACM", null, null, "2026-10-11T18:00", [22.2, 24.9, 52.9]], ["CAG", "JUV", null, null, "2026-10-11T20:45", [15.3, 23.3, 61.4]], ["ATA", "VEN", null, null, "2026-10-12T18:30", [61.2, 21.4, 17.4]], ["TOR", "UDI", null, null, "2026-10-12T20:45", [40.2, 29.2, 30.6]]])
        };

        const FX = Array.from({ length: 38 }, (_, r) => (R[r] || []).map(m => [m[0], m[1]]));
        const date = r => R[r] ? R[r][0][4] : null;
        const hs = (a, b, r) => ((a * 73856093) ^ (b * 19349663) ^ (r * 83492791)) >>> 0;

        function simRes(a, b, r) { const h = hs(a, b, r); let x = [0, 1, 1, 2, 2, 3, 4][(h >> 3) % 7], y = [0, 0, 1, 1, 2, 3][(h >> 9) % 6]; if (T[a][5] > T[b][5] + 3) x++; if (T[b][5] > T[a][5] + 3) y++; return [x, y] }

        const res = (a, b, r) => { const m = (R[r] || []).find(z => z[0] == a && z[1] == b); return m && m[2] != null ? [m[2], m[3]] : null };

        const TB = [["ROM", 4, 1, 0], ["INT", 4, 1, 0], ["LAZ", 4, 1, 0], ["CAG", 4, 0, 1], ["ACM", 3, 2, 0], ["FRO", 3, 1, 1], ["JUV", 3, 1, 1], ["COM", 3, 1, 1], ["NAP", 2, 1, 2], ["SAS", 2, 1, 2], ["ATA", 2, 0, 3], ["LEC", 2, 0, 3], ["UDI", 1, 1, 3], ["TOR", 1, 1, 3], ["PAR", 1, 1, 3], ["MON", 1, 1, 3], ["FIO", 1, 1, 3], ["BFC", 0, 2, 3], ["GEN", 0, 1, 4], ["VEN", 0, 0, 5]].map(([c, v, n, p]) => ({ i: ABB[c], pg: v + n + p, v, n, p, pt: v * 3 + n }));

        const FORMATION_ROWS = {
            '4-3-3': [['lw', 'st', 'rw'], ['cm', 'cm', 'cm'], ['lb', 'cb', 'cb', 'rb'], ['gk']],
            '3-4-3': [['lw', 'st', 'rw'], ['lb', 'cm', 'cm', 'rb'], ['cb', 'cb', 'cb'], ['gk']],
            '4-2-3-1': [['st'], ['lw', 'cam', 'rw'], ['cm', 'cm'], ['lb', 'cb', 'cb', 'rb'], ['gk']],
            '3-5-2': [['st', 'st'], ['lb', 'cm', 'cm', 'cm', 'rb'], ['cb', 'cb', 'cb'], ['gk']],
            '3-4-2-1': [['st'], ['cam', 'cam'], ['lb', 'cm', 'cm', 'rb'], ['cb', 'cb', 'cb'], ['gk']],
            '3-5-1-1': [['st'], ['cam'], ['lb', 'cm', 'cm', 'cm', 'rb'], ['cb', 'cb', 'cb'], ['gk']]
        };

        const CLUB_SQUADS = [
            { formation: '4-3-3', starters: { gk: 'Carnesecchi', rb: 'Bellanova', cb: 'Scalvini|Kristensen', lb: 'Bernasconi', cm: 'Kessié|Gaetano|Ederson', rw: 'De Ketelaere', st: 'Scamacca', lw: 'Rowe' }, alternatives: { cb: 'Hien|Kolasinac', rb: 'Zappacosta', cm: 'Samardzic', lw: 'Raspadori', st: 'Krstovic' } },
            { formation: '3-4-3', starters: { gk: 'Skorupski', cb: 'Helland|Heggem|Theate', rb: 'Zortea', cm: 'Pobega|Ferguson', lb: 'Miranda', rw: 'Orsolini', st: 'Dovbyk', lw: 'Cambiaghi' }, alternatives: { rb: 'Holm', cm: 'Moro', rw: 'Bernardeschi', st: 'Piccoli' } },
            { formation: '4-3-3', starters: { gk: 'Caprile', rb: 'Zè Pedro', cb: 'Mina|Rodriguez', lb: 'Obert', cm: 'Adopo|Winks|Romano', rw: 'Maldini', st: 'Mendy', lw: 'Fazzini' }, alternatives: { rb: 'Sugawara', cm: 'Deiola', st: 'Nzola' } },
            { formation: '4-2-3-1', starters: { gk: 'Butez', rb: 'Yan Couto', cb: 'Chalobah|Ramon', lb: 'Valle', cm: 'Da Cunha|Perrone', rw: 'Diao', cam: 'Nico Paz', lw: 'Baturina', st: 'Douvikas' }, alternatives: { lb: 'Kaiki', cb: 'Kempf', cm: 'Milla', cam: 'Rodriguez', st: 'Kean' } },
            { formation: '4-2-3-1', starters: { gk: 'Palmisani', rb: 'Oyono', cb: 'Calvani|Monterisi', lb: 'Bracaglia', cm: 'Masini|Calò', rw: 'Ghedjemis', cam: 'Schmid', lw: 'Kvernadze', st: 'Raimondo' }, alternatives: { lb: 'Terzic', cm: 'Grilitsch', rw: 'Fini' } },
            { formation: '4-3-3', starters: { gk: 'De Gea', rb: 'Jimenez', cb: 'Dragusin|Ranieri', lb: 'Viery', cm: 'Ndour|Fagioli|Atta', rw: 'Mastantuono', st: 'Pellegrino', lw: 'Pedro Goncalves' }, alternatives: { lb: 'Valdepenas', cb: 'Valdepenas', cm: 'Oulai', rw: 'Njie', st: 'Beto' } },
            { formation: '3-5-2', starters: { gk: 'Bijlow', cb: 'Marcandalli|Ostigard|Vasquez', rb: 'Ehizibue', cm: 'Frendrup|Sow|Baldanzi', lb: 'Ellertsson', st: 'Osmajic|Colombo' }, alternatives: { rb: 'Drameh', st: 'Messias|El Shaarawy|Vitinha' } },
            { formation: '3-5-2', starters: { gk: 'Martinez', cb: 'Bisseck|Akanji|Bastoni', rb: 'Diouf', cm: 'Barella|Calhanoglu|Zielinski', lb: 'Dimarco', st: 'Lautaro|Thuram' }, alternatives: { cb: 'Stones', rb: 'Spence', cm: 'Sucic', st: 'Pio Esposito' } },
            { formation: '4-2-3-1', starters: { gk: 'Vicario', rb: 'Kalulu', cb: 'Bremer|Lucumì', lb: 'Celik', cm: 'Douglas Luiz|McKennie', rw: 'Conceiçao', cam: 'Nico Gonzalez', lw: 'Yildiz', st: 'Kolo Muani' }, alternatives: { gk: 'Sarr', cam: 'Alajbegovic', st: 'Woltemade' } },
            { formation: '4-3-3', starters: { gk: 'Mandas', rb: 'Marusic', cb: 'Doekhi|Provstgaard', lb: 'Nuno Tavares', cm: 'Taylor|Rovella|Frattesi', rw: 'Cancellieri', st: 'Noslin', lw: 'Zaccagni' }, alternatives: { cb: 'Sutalo', rb: 'Floriani', cm: 'Cataldi', rw: 'Isaksen', st: 'Pinamonti' } },
            { formation: '4-3-3', starters: { gk: 'Falcone', rb: 'D. Veiga', cb: 'Gaspar|Tiago Gabriel', lb: 'Gallo', cm: 'Ilic|Ngom|Coulibaly', rw: 'Pierotti', st: 'Geubbels', lw: 'Monteiro' }, alternatives: { cb: 'Siebert', cm: 'Berisha', rw: "N'dri", st: 'Stulic' } },
            { formation: '3-4-2-1', starters: { gk: 'Maignan', cb: 'Gila|De Winter|Pavlovic', rb: 'Chukwueze', cm: 'Modric|Rabiot', lb: 'Moreira', cam: 'Pulisic|Cissé', st: 'Ramos' }, alternatives: { cb: 'Gabbia', lb: 'Estupinan', cm: 'Musah', rb: 'Saelemaekers' } },
            { formation: '4-3-3', starters: { gk: 'Meret', rb: 'Di Lorenzo', cb: 'Rrahmani|Beukema', lb: 'Spinazzola', cm: 'De Bruyne|Lobotka|McTominay', rw: 'Politano', st: 'Hojlund', lw: 'Lang' }, alternatives: { gk: 'Milinkovic', lb: 'Olivera', cm: 'Marin|Anguissa', rw: 'Alisson|Neres' } },
            { formation: '3-5-2', starters: { gk: 'Corvi', cb: 'Delprato|Troilo|Diego Carlos', rb: 'Britschgi', cm: 'Bernabé|Keita|Touré', lb: 'Valeri', st: 'Lontani|Romero' }, alternatives: { cm: 'Sierro|Fabbian', st: 'Elphege' } },
            { formation: '3-4-2-1', starters: { gk: 'Tornqvist', cb: 'Kouadio|Ziolkowski|Carboni', rb: 'Birindelli', cm: 'Pessina|Folorunsho', lb: 'Mangas', cam: 'Zeballos|Robinson', st: 'Varela' }, alternatives: { cm: 'Akinsanmiro', cam: 'Colpani|Ngonge', st: 'Cutrone' } },
            { formation: '3-4-2-1', starters: { gk: 'Svilar', cb: 'Hermoso|Mancini|Balerdi', rb: 'Molina', cm: 'Cristante|Kone', lb: 'Wesley', cam: 'Soulé|Dybala', st: 'Malen' }, alternatives: { cb: 'Ndicka', cm: 'Lulli', cam: 'Mora' } },
            { formation: '4-3-3', starters: { gk: 'Muric', rb: 'Cinquegrano', cb: 'Idzes|Leysen', lb: 'Doig', cm: 'Bakola|Matic|Thorstvedt', rw: 'Berardi', st: 'Esposito', lw: 'Laurienté' }, alternatives: { lb: 'Obrador', cm: 'Adzic', rw: 'Volpato', st: 'Bowie' } },
            { formation: '3-5-1-1', starters: { gk: 'Lucas Perri', cb: 'Comuzzo|Coco|Comert', rb: 'Belghali', cm: 'Mandragora|Fitz-Jim|Braganca', lb: 'Cacciamani', cam: 'Vlasic', st: 'Simeone' }, alternatives: { rb: 'Fortini', cm: 'Gineitis|Casadei', st: 'Adams' } },
            { formation: '3-5-2', starters: { gk: 'Okoye', cb: 'Abankwah|Kabasele|Solet', rb: 'Vojvoda', cm: 'Ekkelenkamp|Karlstrom|Piotrowski', lb: 'Kamara', st: 'Zaniolo|Davis' }, alternatives: { cb: 'Alaba', cm: 'Miller|Unai Gomez' } },
            { formation: '3-5-2', starters: { gk: 'Stankovic', cb: 'Bella-Kotchap|Schingtienne|Juan Jesus', rb: 'Hainaut', cm: 'Basic|Busio|Kike Perez', lb: 'Correia', st: 'Adams|Yeboah' }, alternatives: { rb: 'Mazzocchi', lb: 'Haps', cm: 'Sohm' } }
        ];

        const CLUB_COACHES = ['Sarri', 'Palladino', 'Pisacane', 'Fabregas', 'Alvini', 'Vanoli', 'De Rossi', 'Chivu', 'Spalletti', 'Gattuso', 'Di Francesco', 'Amorim', 'Allegri', 'Cuesta', 'Juric', 'Gasperini', 'Aquilani', 'Abate', 'Runjaic', 'Stroppa'];

        const normalizePlayerName = name => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const USER_OVERALL_ROWS = `
87|Lautaro Martínez;Mike Maignan;Nicolò Barella
86|Scott McTominay;Federico Dimarco;Bremer;Marco Carnesecchi;Alessandro Bastoni
85|Paulo Dybala;Adrien Rabiot;Mile Svilar;Hakan Çalhanoğlu;Marcus Thuram;Kevin De Bruyne;Luka Modrić
84|Kenan Yıldız;Nico Paz;Manuel Locatelli;Wladimiro Falcone;Gianluca Mancini
83|Ivan Provedel;David de Gea;Christian Pulisic;Stanislav Lobotka;Rafael Leão;Donyell Malen;Evan Ndicka;Manuel Akanji;Amir Rrahmani
82|Éderson;Zambo Anguissa;Giovanni Di Lorenzo;Piotr Zieliński;Riccardo Orsolini;Mattia Zaccagni;Domenico Berardi;Moise Kean
81|Khéphren Thuram;Manu Koné;Luis Milla;Henrikh Mkhitaryan;Bryan Cristante;Mario Gila;Alex Meret;Charles De Ketelaere;Pierre Kalulu;Mario Hermoso;David Neres;Alessandro Buongiorno;Alessio Romagnoli
80|Weston McKennie;Wesley;Davide Frattesi;Michele Di Gregorio;Carlos Augusto;Andrea Cambiaso;Youssouf Fofana;Leonardo Spinazzola;Elia Caprile;Benjamin Pavard;Djed Spence;Vanja Milinković-Savić;Guglielmo Vicario;Marten de Roon;Alexis Saelemaekers;Nikola Vlašić;Matías Soulé
78|Douglas Luiz;Lucas Da Cunha;Kenneth Taylor;Adam Marušić;Samuele Ricci;Raoul Bellanova;Sead Kolašinac;Romano Schmid
77|Luis Henrique;Lewis Ferguson;Nahuel Molina;Rodrigo Mora
76|Djibril Sow;Eljif Elmas;Nicolò Zaniolo;Marc-Oliver Kempf;Josep Martínez;Jhon Lucumí
75|Fabio Miretti;Manuel Lazzari;Jurgen Ekkelenkamp;Nikola Moro;Ismaël Koné;Fabiano Parisi;Hamed Junior Traoré;Hans Nicolussi Caviglia;Akor Adams;Tommaso Baldanzi;Martin Vitík
74|Filip Stanković;Davide Bartesaghi;Jesper Karlsson;Patrick Cutrone;Christos Mandas;Alisson Santos;Luca Pellegrini
73|Giovanni Fabbian;Gaetano Oristanio;Gabriele Zappa;Jesper Lindstrøm;Sandi Lovrić;Matija Frigan;Andrea Adorante;M'Bala Nzola;Eray Cömert;Fedde Leysen;Christian Kabasele;Marin Pongračić;Matías Moreno;Alberto Dossena
72|Antonín Barák;Demba Thiam;Oliver Sørensen;Alessio Zerbin;Alfred Duncan;Jakub Piotrowski;Cher Ndour;Hassane Kamara;Junior Messias;Patrick Ciurria;Daniel Boloca;Luca Mazzitelli;Cyril Ngonge
71|Mikael Egill Ellertsson;Idrissa Touré;Santiago Pierotti;Fali Candé;Alieu Fadera;Rahim Alhassane;Giovane;Youssef Maleh;Harry Winks;Robinio Vaz;Kerim Alajbegović;Oier Zarraga;Antoine Hainaut
70|Warren Bondo;Andrea Ghion;Lion Lauberbach;Alan Matturro;Gabriele Bracaglia;Viery;Lameck Banda;Oliver Provstgaard;Kevin Carlos;Joël Marcel Schingtienne;Jan Ziółkowski;Ilario Monterisi;Botond Balogh;Filippo Delli Carri;Mariano Troilo
69|Giuseppe Aurelio;Ridgeciano Haps;Richie Sagrado;Antonio Vergara;Costantino Favasuli;Bartol Franjić;Danilo Veiga;Luis Hasa;Luca Lezzerini;Lorenzo De Silvestri;Boris Radunović;Vasilije Adžić;Giorgi Kvernadze;Elias Havel;Lorenzo Palmisani;James Abankwah;Medon Berisha
68|Þórir Jóhann Helgason;David Puczka;Tommaso Fumagalli;Raffaele Di Gennaro;Matteo Cichella;Eivind Helland;Francesco Gelli;Owen Kouassi;Gabriele Artistico;Vakoun Issouf Bayo;Petar Ratkov
67|Reda Belahyane;Giovanni Daffara;Edoardo Pieragnolo;Lamine Fanne;Niccolò Fortini;Kieron Bowie
66|Alen Sherri;Alessio Cacciamani;Laurs Skjellerup;Marko Farji;Darryl Bakola;Víctor Valdepeñas;Oumar Ngom;Corrie Ndaba;Adrian Przyborek;Francesco Camarda;Filipe Bordon;Redouane Halhal;Alphadjo Cissé;Joseph Liteta
65|Rachid Kouda;Patrick Amoako Nuamah;Christian Comotto;Leonardo Colombo;Alessandro Romano;Matteo Pisseri;Marco Dalla Vecchia;Alvin Obinna Okoro;Omari Forson;Alieu Njie
63|Antonio Arena;Flavio Russo;Peter Amoran;Kevin Miranda
62|Aaron Ciammaglichella;Gioele Zacchi;Lorenzo Torriani;Davide Renzetti;Eddy Kouadio;Sebastian Esposito`;

        const USER_OVERALLS = new Map(USER_OVERALL_ROWS.trim().split(/\r?\n/).flatMap(row => {
            const [overall, names] = row.split('|');
            return names.split(';').map(name => [normalizePlayerName(name), Number(overall)]);
        }));

        const PLAYER_OVERALL_ALIASES = {
            martinez: 'josep martinez',
            alisson: 'alisson santos',
            adams: 'akor adams',
            kone: 'manu kone',
            dveiga: 'danilo veiga'
        };

        const EA_OVERALLS = new Map(Object.entries({
            Bernasconi: 71,
            Scamacca: 78,
            Rowe: 76,
            Hien: 79,
            Zappacosta: 79,
            Samardzic: 78,
            Raspadori: 78,
            Krstovic: 76,
            Scalvini: 77,
            Kristensen: 72,
            Skorupski: 78,
            Heggem: 75,
            Theate: 80,
            Zortea: 73,
            Pobega: 74,
            Miranda: 76,
            Dovbyk: 79,
            Cambiaghi: 76,
            Holm: 75,
            Bernardeschi: 75,
            Piccoli: 75,
            Butez: 76,
            'Yan Couto': 77,
            Chalobah: 79,
            Valle: 72
        }).map(([name, overall]) => [normalizePlayerName(name), overall]));

        function getPlayerOverall(name) {
            const normalized = normalizePlayerName(name);
            const alias = normalizePlayerName(PLAYER_OVERALL_ALIASES[normalized] || name);
            if (USER_OVERALLS.has(alias)) return USER_OVERALLS.get(alias);
            const matches = [...USER_OVERALLS].filter(([ratedName]) => ratedName.endsWith(alias) || ratedName.startsWith(alias));
            const ratings = [...new Set(matches.map(([, overall]) => overall))];
            return ratings.length === 1 ? ratings[0] : EA_OVERALLS.get(alias) ?? 75;
        }

        const CLUB_OVR_OVERRIDES = {
            Inter: 83,
            Roma: 82,
            Napoli: 82,
            Juventus: 82,
            Milan: 81,
            Como: 80,
            Atalanta: 80,
            Lazio: 79,
            Bologna: 78,
            Cagliari: 78,
            Fiorentina: 78,
            Genoa: 77,
            Lecce: 77,
            Parma: 77,
            Monza: 77,
            Torino: 77,
            Udinese: 77,
            Venezia: 77,
            Frosinone: 76,
            Sassuolo: 76
        };

        function getClubOverall(clubIndex) {
            const clubName = T[clubIndex]?.[0];
            if (clubName && CLUB_OVR_OVERRIDES[clubName]) return CLUB_OVR_OVERRIDES[clubName];
            const squad = CLUB_SQUADS[clubIndex];
            if (!squad) return 75;
            const starters = Object.values(squad.starters).flatMap(value => String(value).split('|'));
            const ratings = starters.map(getPlayerOverall).filter(Number.isFinite);
            return Math.round(ratings.reduce((sum, rating) => sum + rating, 0) / (ratings.length || 1));
        }

        const ROLE_NAMES = {
            gk: 'Portiere',
            cb: 'Difensore',
            lb: 'Terzino Sinistro',
            rb: 'Terzino Destro',
            cm: 'Centrocampista',
            cam: 'Trequartista',
            lw: 'Ala Sinistra',
            rw: 'Ala Destra',
            st: 'Attaccante'
        };

        const ROLE_SHORT = {
            gk: 'GK',
            cb: 'CB',
            lb: 'LB',
            rb: 'RB',
            cm: 'CM',
            cam: 'CAM',
            lw: 'LW',
            rw: 'RW',
            st: 'ST'
        };

        let currentFormation = null;
        let userTeamName = '';
        let confirmedTeamName = false;
        let selectedTeam = null;
        let userLineup = {};
        let draftedTeams = new Set();
        let usedPlayers = new Set();
        let activeDraftPlayers = [];
        let clubSkips = 0;
        let currentDraftPick = -1;
        let draftLegendOffer = false;
        let legendRevealSeenThisPick = false;
        const FORMATION_DRAFT_KEY = 'serieA_formationDraft_v1';
        function saveFormationDraft() {
            try {
                if (!confirmedTeamName) {
                    localStorage.removeItem(FORMATION_DRAFT_KEY);
                    return;
                }
                localStorage.setItem(FORMATION_DRAFT_KEY, JSON.stringify({
                    userTeamName,
                    currentFormation,
                    userLineup,
                    draftedTeams: [...draftedTeams],
                    usedPlayers: [...usedPlayers],
                    clubSkips,
                    currentDraftPick,
                    draftLegendOffer,
                    legendRevealSeenThisPick,
                    selectedTeam
                }));
            } catch (error) {
                console.warn('Impossibile salvare la formazione in questo browser.', error);
            }
        }

        function restoreFormationDraft() {
            let saved;
            try {
                saved = JSON.parse(localStorage.getItem(FORMATION_DRAFT_KEY) || 'null');
            } catch (error) {
                localStorage.removeItem(FORMATION_DRAFT_KEY);
                return false;
            }
            if (!saved || !saved.userTeamName || (saved.currentFormation && !FORMATION_ROWS[saved.currentFormation])) return false;

            userTeamName = saved.userTeamName;
            confirmedTeamName = true;
            currentFormation = saved.currentFormation;
            userLineup = saved.userLineup || {};
            draftedTeams = new Set(saved.draftedTeams || []);
            usedPlayers = new Set(saved.usedPlayers || []);
            clubSkips = saved.clubSkips || 0;
            currentDraftPick = saved.currentDraftPick ?? Object.keys(userLineup).length;
            draftLegendOffer = !!saved.draftLegendOffer;
            legendRevealSeenThisPick = !!saved.legendRevealSeenThisPick;
            selectedTeam = Number.isInteger(saved.selectedTeam) ? saved.selectedTeam : null;
            activeDraftPlayers = selectedTeam !== null ? getClubPlayers(selectedTeam) : [];

            $('#squad-name').value = userTeamName;
            $('#squad-name-step').classList.add('confirmed');
            $('#squad-name-confirm').textContent = 'NOME CONFERMATO ✓';
            $('#squad-name-error').textContent = '';
            $$('.mod-btn').forEach(button => {
                const selected = button.dataset.mod === currentFormation;
                button.disabled = false;
                button.classList.toggle('active', selected);
                button.setAttribute('aria-pressed', String(selected));
            });
            $('#formation-label').textContent = currentFormation ? `MODULO ${currentFormation}` : 'MODULO --';
            renderFormation();

            if (!currentFormation) return true;

            if (Object.keys(userLineup).length >= 11) {
                selectedTeam = null;
                activeDraftPlayers = [];
                $('#forma-team').textContent = userTeamName.toUpperCase();
                $('#draft-club').textContent = 'PRONTO PER LA SIMULAZIONE';
                $('#next-team-btn').disabled = true;
                $('#play-btn').style.display = 'inline-block';
                $('#play-btn').disabled = false;
            } else if (selectedTeam !== null) {
                $('#forma-team').textContent = 'TURNO DRAFT';
                $('#draft-club').textContent = `${T[selectedTeam][0].toUpperCase()} · ${Object.keys(userLineup).length + 1}° PICK`;
                updateClubSkipControl();
                openPlayerSelection();
            } else {
                drawNextDraftTeam();
            }
            return true;
        }

        function updateClubSkipControl() {
            $('#club-skip-count').textContent = `${clubSkips}/3`;
            $('#next-team-btn').disabled = selectedTeam === null || clubSkips >= 3;
        }

        function confirmTeamName() {
            const value = $('#squad-name').value.trim().replace(/\s+/g, ' ');
            if (!value) {
                $('#squad-name-error').textContent = 'Scrivi prima il nome della squadra.';
                $('#squad-name').focus();
                return;
            }
            userTeamName = value.slice(0, 24);
            confirmedTeamName = true;
            $('#squad-name').value = userTeamName;
            $('#squad-name-error').textContent = '';
            $('#squad-name-step').classList.add('confirmed');
            $('#squad-name-confirm').textContent = 'NOME CONFERMATO ✓';
            $$('.mod-btn').forEach(button => button.disabled = false);
            $('#forma-team').textContent = userTeamName.toUpperCase();
            saveFormationDraft();
        }

        $('#squad-name-confirm').addEventListener('click', confirmTeamName);
        $('#squad-name').addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                confirmTeamName();
            }
        });
        $('#squad-name').addEventListener('input', () => {
            if (confirmedTeamName && $('#squad-name').value.trim() !== userTeamName) {
                confirmedTeamName = false;
                $('#squad-name-step').classList.remove('confirmed');
                $('#squad-name-confirm').textContent = 'CONFERMA NOME →';
                $$('.mod-btn').forEach(button => button.disabled = true);
                currentFormation = null;
                userLineup = {};
                selectedTeam = null;
                activeDraftPlayers = [];
                draftedTeams = new Set();
                usedPlayers = new Set();
                clubSkips = 0;
                currentDraftPick = -1;
                draftLegendOffer = false;
                closePlayerModal();
                $('#play-btn').style.display = 'none';
                $('#play-btn').disabled = true;
                renderFormation();
                saveFormationDraft();
            }
            $('#squad-name-error').textContent = '';
        });

        // BASIC FUNCTIONS ONLY - REST WILL BE ADDED
        function resetFormationState() {
            userTeamName = '';
            confirmedTeamName = false;
            currentFormation = null;
            selectedTeam = null;
            userLineup = {};
            draftedTeams = new Set();
            usedPlayers = new Set();
            activeDraftPlayers = [];
            clubSkips = 0;
            currentDraftPick = -1;
            draftLegendOffer = false;
            legendRevealSeenThisPick = false;
            localStorage.removeItem(FORMATION_DRAFT_KEY);

            $('#squad-name').value = '';
            $('#squad-name-step').classList.remove('confirmed');
            $('#squad-name-confirm').textContent = 'CONFERMA NOME →';
            $('#squad-name-error').textContent = '';
            $('#forma-team').textContent = 'SQUADRA IN COSTRUZIONE';
            $('#formation-label').textContent = 'MODULO --';
            $('#draft-club').textContent = 'SCEGLI UN MODULO';
            $('#play-btn').style.display = 'none';
            $('#play-btn').disabled = true;
            $('#draft-summary').classList.add('hidden');
            $('.formation-layout').classList.remove('hidden');
            $$('.mod-btn').forEach(button => {
                button.disabled = true;
                button.classList.remove('active');
                button.setAttribute('aria-pressed', 'false');
            });
            closePlayerModal();
            renderFormation();
        }

        function openFormationBuilder() {
            console.log('OPENING FORMATION BUILDER');
            resetFormationState();
            const forma = $('#forma');
            forma.scrollTop = 0;
            forma.classList.add('active');
            document.body.classList.add('builder-open');
            document.body.style.overflow = 'hidden';
        }

        // La formazione non deve sopravvivere quando si torna su questa pagina,
        // nemmeno se il browser la recupera dalla cache di navigazione.
        window.addEventListener('pageshow', resetFormationState);
        window.addEventListener('pagehide', () => localStorage.removeItem(FORMATION_DRAFT_KEY));

        function closeFormationBuilder({ reset = true } = {}) {
            if (reset) resetFormationState();
            closePlayerModal();
            const forma = $('#forma');
            forma.classList.remove('active');
            document.body.classList.remove('builder-open');
            document.body.style.overflow = '';
        }

        function closePlayerModal() {
            const modal = $('#player-modal');
            modal.classList.remove('active');
            saveFormationDraft();
        }

        function finishLegendReveal() {
            const reveal = $('#legend-reveal');
            if (!reveal) return;
            window.clearTimeout(reveal.fallbackTimer);
            reveal.classList.remove('revealing');
            reveal.classList.add('hidden');
        }

        function getClubPlayers(clubIndex) {
            const squad = CLUB_SQUADS[clubIndex];
            const players = new Map();
            [...Object.entries(squad.starters), ...Object.entries(squad.alternatives)].forEach(([role, roster]) => {
                roster.split('|').map(name => name.trim()).filter(Boolean).forEach(name => {
                    const playerKey = normalizePlayerName(name);
                    const player = players.get(playerKey) || { name, club: clubIndex, roles: [], overall: getPlayerOverall(name) };
                    if (!player.roles.includes(role)) player.roles.push(role);
                    players.set(playerKey, player);
                });
            });
            return [...players.values()].sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1));
        }

        function getRoleSlotId(role, roleIndex) {
            return `${role}-${roleIndex}`;
        }

        function getCompatibleSlotRoles(roles) {
            return roles.flatMap(role => role === 'cam' ? ['cam', 'cm'] : [role]);
        }

        function getOpenRoles(roles) {
            const roleCapacity = {};
            const roleFilled = {};
            FORMATION_ROWS[currentFormation].flat().forEach(role => {
                roleCapacity[role] = (roleCapacity[role] || 0) + 1;
            });
            Object.values(userLineup).forEach(player => {
                roleFilled[player.role] = (roleFilled[player.role] || 0) + 1;
            });
            const compatibleRoles = getCompatibleSlotRoles(roles);
            return compatibleRoles.filter(role => roleCapacity[role] && (roleFilled[role] || 0) < roleCapacity[role]);
        }

        function renderFormation() {
            if (!currentFormation) {
                $('#pitch-builder').replaceChildren();
                $('#forma-info').style.display = 'none';
                return;
            }
            const roleCounts = {};
            $('#pitch-builder').innerHTML = `<div class="pitch-grid">${FORMATION_ROWS[currentFormation].map(row => `<div class="pitch-row">${row.map(role => {
                const roleIndex = roleCounts[role] || 0;
                const slotId = getRoleSlotId(role, roleIndex);
                roleCounts[role] = roleIndex + 1;
                const player = userLineup[slotId];
                return player
                    ? `<div class="pitch-slot filled${player.isLegend ? ' icon-player' : ''}" data-slot="${slotId}" data-role="${role}" style="--pc:${T[player.club][3]}"><span class="slot-shirt">${ROLE_SHORT[role]}</span><span class="player-mini">${player.name}${player.isLegend ? '<small class="legend-badge">ICONA</small>' : ''}</span><span class="slot-overall">OVR ${player.overall ?? '--'}</span><span class="slot-club">${T[player.club][0]}</span></div>`
                    : `<div class="pitch-slot empty" data-role="${role}"><span class="slot-plus" aria-hidden="true">+</span><span class="role">${ROLE_NAMES[role]}</span></div>`;
            }).join('')}</div>`).join('')}</div>`;
            $('#forma-info').style.display = 'flex';
            $('#forma-team').textContent = Object.keys(userLineup).length === 11 ? 'DRAFT COMPLETATO' : 'SQUADRA IN COSTRUZIONE';
            $('#lineup-count').textContent = `${Object.keys(userLineup).length} / 11 GIOCATORI`;
        }

        function draftMetrics() {
            const players = Object.values(userLineup);
            const average = roles => {
                const selected = players.filter(player => roles.includes(player.role));
                return Math.round(selected.reduce((total, player) => total + (player.overall ?? 75), 0) / (selected.length || 1));
            };
            return {
                players,
                overall: Math.round(players.reduce((total, player) => total + (player.overall ?? 75), 0) / (players.length || 1)),
                attack: average(['lw', 'rw', 'st', 'cam']),
                midfield: average(['cm', 'cam']),
                defence: average(['gk', 'cb', 'lb', 'rb']),
                best: players.slice().sort((a, b) => (b.overall ?? 75) - (a.overall ?? 75))[0]
            };
        }

        function draftTeamCode() {
            const words = userTeamName.trim().split(/\s+/).filter(Boolean);
            const code = words.length > 1
                ? `${words[0][0]}${words[1].slice(0, 2)}`
                : (words[0] || '').slice(0, 3);
            const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
            return cleanCode || 'FC';
        }

        function renderDraftSummaryPitch() {
            const roleCounts = {};
            $('#draft-summary-pitch').innerHTML = FORMATION_ROWS[currentFormation].map(row => `<div class="draft-summary-pitch-row">${row.map(role => {
                const roleIndex = roleCounts[role] || 0;
                roleCounts[role] = roleIndex + 1;
                const player = userLineup[getRoleSlotId(role, roleIndex)];
                return `<div class="draft-summary-player"><small>${ROLE_SHORT[role]}</small><b>${player ? escapeDraftHtml(player.name) : '—'}</b><em>${player ? player.overall ?? 75 : '--'}</em></div>`;
            }).join('')}</div>`).join('');
        }

        function renderDraftSummary() {
            const metrics = draftMetrics();
            const best = metrics.best || { name: '--', overall: 75 };
            $('#draft-summary-team').textContent = userTeamName.toUpperCase();
            animateDraftValue('#draft-overall', metrics.overall);
            animateDraftValue('#draft-attack', metrics.attack);
            animateDraftValue('#draft-midfield', metrics.midfield);
            animateDraftValue('#draft-defence', metrics.defence);
            $('#draft-best-player').textContent = best.name;
            $('#draft-best-rating').textContent = `${best.overall ?? 75} OVR`;
            $('#draft-card-team').textContent = userTeamName.toUpperCase();
            animateDraftValue('#draft-card-overall', metrics.overall);
            animateDraftValue('#draft-card-attack', metrics.attack);
            animateDraftValue('#draft-card-midfield', metrics.midfield);
            animateDraftValue('#draft-card-defence', metrics.defence);
            renderDraftSummaryPitch();
            $('#draft-summary').classList.remove('hidden');
            $('.formation-layout').classList.add('hidden');
        }

        function animateDraftValue(selector, target) {
            const element = $(selector);
            if (!element) return;
            const end = Number(target) || 0;
            const started = performance.now();
            element.textContent = '0';
            element.classList.remove('value-pop');
            const tick = now => {
                const progress = Math.min(1, (now - started) / 650);
                element.textContent = Math.round(end * (1 - Math.pow(1 - progress, 3)));
                if (progress < 1) requestAnimationFrame(tick);
                else element.classList.add('value-pop');
            };
            requestAnimationFrame(tick);
        }

        function hideDraftSummary() {
            $('#draft-summary').classList.add('hidden');
            $('.formation-layout').classList.remove('hidden');
        }

        $('#edit-draft-btn').addEventListener('click', () => {
            hideDraftSummary();
            $('#pitch-builder').classList.add('editing');
            $('#draft-club').textContent = 'CLICCA UN GIOCATORE PER SOSTITUIRLO';
        });

        $('#pitch-builder').addEventListener('click', event => {
            if (!$('#pitch-builder').classList.contains('editing')) return;
            const slot = event.target.closest('.pitch-slot.filled');
            if (!slot) return;
            const player = userLineup[slot.dataset.slot];
            if (!player) return;
            delete userLineup[slot.dataset.slot];
            usedPlayers.delete(normalizePlayerName(player.name));
            currentDraftPick = Object.keys(userLineup).length;
            selectedTeam = null;
            activeDraftPlayers = [];
            $('#pitch-builder').classList.remove('editing');
            renderFormation();
            drawNextDraftTeam();
        });

        $('#copy-team-btn').addEventListener('click', async () => {
            const metrics = draftMetrics();
            const code = `${draftTeamCode()}-${metrics.overall}-${metrics.attack}-${metrics.midfield}-${metrics.defence}`;
            try {
                await navigator.clipboard.writeText(code);
            } catch (error) {
                const fallback = document.createElement('textarea');
                fallback.value = code;
                document.body.appendChild(fallback);
                fallback.select();
                document.execCommand('copy');
                fallback.remove();
            }
            const button = $('#copy-team-btn');
            button.textContent = `COPIATO · ${code}`;
            window.setTimeout(() => { button.textContent = '📋 COPIA SQUADRA'; }, 2200);
        });

        function openPlayerSelection() {
            const candidates = activeDraftPlayers.map(player => ({ ...player, availableRoles: getOpenRoles(player.roles) }));
            $('#modal-title').textContent = 'SCEGLI UN GIOCATORE';
            $('#modal-role').textContent = `${T[selectedTeam][0]} · ${candidates.filter(player => player.availableRoles.length).length} COMPATIBILI${draftLegendOffer ? ' · EVENTO RARO: ICONA' : ''}`;
            const playerCards = candidates.map((player, index) => {
                const blocked = player.availableRoles.length === 0 || usedPlayers.has(normalizePlayerName(player.name));
                const roleText = blocked ? 'RUOLO OCCUPATO' : player.availableRoles.map(role => ROLE_SHORT[role]).join(' / ');
                return `<button class="player-card${blocked ? ' unavailable' : ''}" type="button" data-player="${index}" style="--pc:${T[player.club][3]}"${blocked ? ' disabled' : ''}><span class="flag">${player.availableRoles[0] ? ROLE_SHORT[player.availableRoles[0]] : ROLE_SHORT[player.roles[0]]}</span><span class="name">${player.name}</span><span class="ovr">${player.overall ?? '--'}</span><span class="club">${roleText}</span>${blocked ? '<span class="draft-cross" aria-label="Non selezionabile">×</span>' : ''}</button>`;
            }).join('');
            const iconCards = draftLegendOffer ? window.LEGEND_REWARDS
                .map(legend => ({ ...legend, openRoles: getOpenRoles([legend.role]) }))
                .filter(legend => legend.openRoles.length && !Object.values(userLineup).some(player => player.legendId === legend.id))
                .map(legend => `<button class="legend-choice draft-legend-choice" type="button" data-draft-legend="${legend.id}"><span class="legend-choice-rating">${legend.overall}</span><span class="legend-choice-mark">ICONA RARA</span><b>${legend.name}</b><small>${ROLE_NAMES[legend.role]} · ${ROLE_SHORT[legend.role]}</small></button>`).join('') : '';
            $('#player-grid').innerHTML = `${iconCards ? `<div class="draft-legend-offer"><span>COLPO DI FORTUNA</span><b>Scegli un’icona al posto del giocatore di questo pick</b><div class="draft-legend-grid">${iconCards}</div></div>` : ''}${playerCards}`;
            if (draftLegendOffer && !legendRevealSeenThisPick) {
                const reveal = $('#legend-reveal');
                reveal.classList.remove('hidden');
                reveal.classList.add('revealing');
                legendRevealSeenThisPick = true;
                if (matchMedia('(prefers-reduced-motion: reduce)').matches) finishLegendReveal();
                else {
                    reveal.fallbackTimer = window.setTimeout(finishLegendReveal, 2200);
                    reveal.addEventListener('animationend', finishLegendReveal, { once: true });
                }
                saveFormationDraft();
            }
            $('#player-modal').classList.add('active');
        }

        function drawNextDraftTeam() {
            if (!currentFormation || !confirmedTeamName) return;
            const pickNumber = Object.keys(userLineup).length;
            if (currentDraftPick !== pickNumber) {
                currentDraftPick = pickNumber;
                legendRevealSeenThisPick = false;
                const hasLegend = Object.values(userLineup).some(player => player.isLegend);
                const hasCompatibleIcon = window.LEGEND_REWARDS.some(legend => getOpenRoles([legend.role]).length > 0);
                draftLegendOffer = !hasLegend && hasCompatibleIcon && Math.random() < 0.03;
            }
            if (Object.keys(userLineup).length >= 11) {
                selectedTeam = null;
                activeDraftPlayers = [];
                draftLegendOffer = false;
                $('#draft-club').textContent = 'DRAFT COMPLETATO';
                $('#next-team-btn').disabled = true;
                $('#play-btn').style.display = 'none';
                $('#play-btn').disabled = true;
                closePlayerModal();
                renderFormation();
                renderDraftSummary();
                saveFormationDraft();
                return;
            }
            let availableTeams = Array.from({ length: T.length }, (_, index) => index)
                .filter(index => !draftedTeams.has(index))
                .filter(index => getClubPlayers(index).some(player => getOpenRoles(player.roles).length && !usedPlayers.has(normalizePlayerName(player.name))));
            if (!availableTeams.length) {
                draftedTeams.clear();
                availableTeams = Array.from({ length: T.length }, (_, index) => index)
                    .filter(index => getClubPlayers(index).some(player => getOpenRoles(player.roles).length && !usedPlayers.has(normalizePlayerName(player.name))));
            }
            if (!availableTeams.length) return;
            selectedTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
            draftedTeams.add(selectedTeam);
            activeDraftPlayers = getClubPlayers(selectedTeam);
            $('#forma-info').style.display = 'flex';
            $('#forma-team').textContent = 'TURNO DRAFT';
            $('#draft-club').textContent = `${T[selectedTeam][0].toUpperCase()} · ${Object.keys(userLineup).length + 1}° PICK`;
            updateClubSkipControl();
            saveFormationDraft();
            openPlayerSelection();
        }

        $$('.mod-btn').forEach(button => button.addEventListener('click', () => {
            if (!confirmedTeamName) return;
            clubSkips = 0;
            currentDraftPick = -1;
            draftLegendOffer = false;
            legendRevealSeenThisPick = false;
            currentFormation = button.dataset.mod;
            userLineup = {};
            usedPlayers = new Set();
            draftedTeams = new Set();
            selectedTeam = null;
            $$('.mod-btn').forEach(option => {
                const selected = option === button;
                option.classList.toggle('active', selected);
                option.setAttribute('aria-pressed', String(selected));
            });
            $('#formation-label').textContent = `MODULO ${currentFormation}`;
            $('#play-btn').style.display = 'none';
            $('#play-btn').disabled = true;
            $('#next-team-btn').disabled = false;
            renderFormation();
            saveFormationDraft();
            drawNextDraftTeam();
        }));

        $('#next-team-btn').addEventListener('click', () => {
            if (selectedTeam === null || clubSkips >= 3) return;
            clubSkips++;
            drawNextDraftTeam();
        });

        $('#player-grid').addEventListener('click', event => {
            const legendCard = event.target.closest('[data-draft-legend]');
            if (legendCard) {
                const legend = window.LEGEND_REWARDS.find(item => item.id === legendCard.dataset.draftLegend);
                if (!legend || !draftLegendOffer) return;
                const role = getOpenRoles([legend.role])[0];
                if (!role) return;
                const roleIndex = Object.values(userLineup).filter(picked => picked.role === role).length;
                userLineup[getRoleSlotId(role, roleIndex)] = {
                    name: legend.name,
                    club: selectedTeam,
                    roles: [role],
                    role,
                    overall: legend.overall,
                    legendId: legend.id,
                    isLegend: true
                };
                usedPlayers.add(normalizePlayerName(legend.name));
                draftLegendOffer = false;
                legendRevealSeenThisPick = false;
                closePlayerModal();
                renderFormation();
                saveFormationDraft();
                drawNextDraftTeam();
                return;
            }
            const card = event.target.closest('[data-player]');
            if (!card || card.disabled) return;
            const player = activeDraftPlayers[+card.dataset.player];
            if (!player || usedPlayers.has(normalizePlayerName(player.name))) return;
            const role = getOpenRoles(player.roles)[0];
            if (!role) return;
            const roleIndex = Object.values(userLineup).filter(picked => picked.role === role).length;
            userLineup[getRoleSlotId(role, roleIndex)] = { ...player, role };
            usedPlayers.add(normalizePlayerName(player.name));
            draftLegendOffer = false;
            legendRevealSeenThisPick = false;
            closePlayerModal();
            renderFormation();
            saveFormationDraft();
            if (Object.keys(userLineup).length >= 11) {
                drawNextDraftTeam();
                return;
            }
            drawNextDraftTeam();
        });

        $('#forma-close').addEventListener('click', closeFormationBuilder);
        $('#legend-reveal-skip').addEventListener('click', finishLegendReveal);
        $('#modal-close').addEventListener('click', closePlayerModal);
        $('#player-modal').addEventListener('click', event => {
            if (event.target.id === 'player-modal') closePlayerModal();
        });

        function sampleGoals(expectedGoals) {
            const threshold = Math.exp(-expectedGoals);
            let product = 1;
            let goals = 0;
            do {
                goals++;
                product *= Math.max(Math.random(), Number.EPSILON);
            } while (product > threshold);
            return goals - 1;
        }

        function simulateFullSeason() {
            const userPlayers = Object.values(userLineup);
            const averageForRoles = roles => {
                const selected = userPlayers.filter(player => roles.includes(player.role));
                return selected.reduce((total, player) => total + (player.overall ?? 75), 0) / (selected.length || 1);
            };
            const overall = averageForRoles(userPlayers.map(player => player.role));
            const attackOverall = averageForRoles(['lw', 'rw', 'st', 'cam']);
            const midfieldOverall = averageForRoles(['cm', 'cam']);
            const defenceOverall = averageForRoles(['cb', 'lb', 'rb']);
            const goalkeeperOverall = averageForRoles(['gk']);
            const toStrength = rating => Math.max(1, Math.min(9, 1 + (rating - 55) * 0.22));
            const league = T.map((team, index) => ({
                id: index,
                name: team[0],
                strength: toStrength(getClubOverall(index)),
                rating: getClubOverall(index),
                attack: toStrength(getClubOverall(index)),
                midfield: toStrength(getClubOverall(index)),
                defence: toStrength(getClubOverall(index)),
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0,
                isUser: false
            }));
            const replacement = league.reduce((weakest, team, index) => team.strength < league[weakest].strength ? index : weakest, 0);
            const replacedClub = league[replacement].name;
            const userTeamId = league[replacement].id;
            league[replacement] = {
                id: userTeamId,
                    name: userTeamName,
                strength: toStrength(overall) + 0.8,
                rating: overall,
                attack: toStrength(attackOverall) * 0.72 + toStrength(midfieldOverall) * 0.28 + 0.8,
                defence: toStrength(defenceOverall) * 0.78 + toStrength(goalkeeperOverall) * 0.22 + 0.75,
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0,
                points: 0,
                isUser: true
            };

            let rotation = league.map(team => team.id);
            const firstHalf = [];
            for (let round = 0; round < 19; round++) {
                const fixtures = [];
                for (let index = 0; index < rotation.length / 2; index++) {
                    const home = rotation[index];
                    const away = rotation[rotation.length - 1 - index];
                    fixtures.push([home, away]);
                }
                firstHalf.push(fixtures);
                const last = rotation.pop();
                rotation.splice(1, 0, last);
            }
            const fixtures = [...firstHalf, ...firstHalf.map(round => round.map(([home, away]) => [away, home]))];
            const userFixtures = [];
            fixtures.forEach((roundFixtures, roundIndex) => roundFixtures.forEach(([homeId, awayId]) => {
                const home = league.find(team => team.id === homeId);
                const away = league.find(team => team.id === awayId);
                const homeRatingEdge = Math.max(-0.8, Math.min(0.8, (home.rating - away.rating) * 0.03));
                const awayRatingEdge = Math.max(-0.8, Math.min(0.8, (away.rating - home.rating) * 0.03));
                const homeXg = Math.max(0.2, Math.min(3.5,
                    1.3 + (home.attack - away.defence) * 0.18 + homeRatingEdge + 0.16
                    + (home.isUser ? 0.18 : 0) - (away.isUser ? 0.12 : 0)));
                const awayXg = Math.max(0.2, Math.min(3.5,
                    1.05 + (away.attack - home.defence) * 0.18 + awayRatingEdge
                    + (away.isUser ? 0.18 : 0) - (home.isUser ? 0.12 : 0)));
                const homeGoals = sampleGoals(homeXg);
                const awayGoals = sampleGoals(awayXg);
                home.played++;
                away.played++;
                home.goalsFor += homeGoals;
                home.goalsAgainst += awayGoals;
                away.goalsFor += awayGoals;
                away.goalsAgainst += homeGoals;
                if (homeGoals > awayGoals) {
                    home.wins++;
                    home.points += 3;
                    away.losses++;
                } else if (homeGoals < awayGoals) {
                    away.wins++;
                    away.points += 3;
                    home.losses++;
                } else {
                    home.draws++;
                    away.draws++;
                    home.points++;
                    away.points++;
                }
                if (home.isUser || away.isUser) {
                    userFixtures.push({
                        round: roundIndex + 1,
                        home: home.name,
                        away: away.name,
                        homeGoals,
                        awayGoals,
                        isHome: home.isUser
                    });
                }
            }));

            const standings = league.sort((a, b) => b.points - a.points
                || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
                || b.goalsFor - a.goalsFor);
            return { standings, userFixtures, replacedClub };
        }

        function startSeasonSimulation() {
            if (!confirmedTeamName || Object.keys(userLineup).length !== 11) return;
            closeFormationBuilder({ reset: false });
            $('#simul').classList.add('active');
            document.body.style.overflow = 'hidden';
            $('#simul-loading').style.display = 'block';
            $('#simul-results').style.display = 'none';
            $('#simul-squad-info').textContent = `${userTeamName.toUpperCase()} · MODULO ${currentFormation} · CAMPIONATO A 20 SQUADRE`;
            window.setTimeout(() => {
                const { standings, userFixtures, replacedClub } = simulateFullSeason();
                const userPosition = standings.findIndex(team => team.isUser) + 1;
                const userTeam = standings.find(team => team.isUser);
                $('#round-results').innerHTML = `<div class="season-summary"><strong>SEI ARRIVATO ${userPosition}°</strong><span>${userTeam.points} punti · ${userTeam.wins} vittorie · ${userTeam.draws} pareggi · ${userTeam.losses} sconfitte</span><span>38 giornate · 19 avversari · 20 squadre · 380 partite totali</span><span>La tua squadra entra al posto di ${replacedClub}.</span></div><div class="round-results"><h2 class="cond">IL TUO CAMPIONATO</h2><div class="user-fixtures">${userFixtures.map(fixture => `<div class="match-sim"><div class="team"><b>${fixture.home}</b><small>${fixture.isHome ? 'CASA' : 'TRASFERTA'}</small></div><div class="score">${fixture.homeGoals} - ${fixture.awayGoals}</div><div class="team"><b>${fixture.away}</b><small>GIORNATA ${fixture.round}</small></div></div>`).join('')}</div></div>`;
                $('#standings-final').innerHTML = `<div style="overflow-x: auto"><table><thead><tr><th>POS</th><th>SQUADRA</th><th>PG</th><th>V</th><th>N</th><th>P</th><th>DR</th><th>PT</th></tr></thead><tbody>${standings.map((team, index) => `<tr${team.isUser ? ' class="user-standing"' : ''}><td>${index + 1}</td><td>${team.name}</td><td>${team.played}</td><td>${team.wins}</td><td>${team.draws}</td><td>${team.losses}</td><td>${team.goalsFor - team.goalsAgainst}</td><td>${team.points}</td></tr>`).join('')}</tbody></table></div>`;
                $('#simul-loading').style.display = 'none';
                $('#simul-results').style.display = 'block';
                resetFormationState();
            }, 350);
        }

        $('#simul-close').addEventListener('click', () => {
            $('#simul').classList.remove('active');
            document.body.style.overflow = '';
        });
        $('#back-btn').addEventListener('click', () => {
            $('#simul').classList.remove('active');
            document.body.style.overflow = '';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // REST OF ORIGINAL CODE HERE...
        const shield = i => `<div class="sh cond" style="--c1:${T[i][3]};--c2:${T[i][4]};color:${T[i][3] == '#e9e9e9' || T[i][3] == '#f2c500' || T[i][3] == '#cfcfcf' ? '#000' : '#fff'}">${ini(T[i][0])}</div>`;
        const fd = d => d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

        $('#tr').innerHTML = TB.map((z, k) => { const t = T[z.i]; return `<article class="tp" tabindex="0" style="--c1:${t[3]};--c2:${t[4]}" data-c="${t[3]}">${shield(z.i)}<h3 class="cond">${t[0]}</h3><div class="x">${t[1]} · ${t[2]}<br>Posizione attuale: ${k + 1}° · ${z.pt} pt<br>V ${z.v} · N ${z.n} · P ${z.p}</div></article>` }).join('');

        $$('.tp').forEach(p => { const set = () => { $('#teams').style.background = `color-mix(in srgb,${p.dataset.c} 30%,#050505)`; document.documentElement.style.setProperty('--ac', p.dataset.c) }; p.onmouseenter = p.onfocus = set; p.onclick = () => { $$('.tp').forEach(x => x.classList.remove('o')); p.classList.add('o'); set() }; p.onmouseleave = () => { $('#teams').style.background = '' } });

        const BM = [3, 7, 2, 6, 1].map(i => R[5][i]);
        $('#tl').innerHTML = BM.map(m => `<article class="bm"><div class="lab">GIORNATA 6</div><div class="vs cond"><span>${ini(T[m[0]][0])}</span><span style="color:#666;font-size:20px">VS</span><span>${ini(T[m[1]][0])}</span></div><small>${fd(m[4])} · ${T[m[0]][2]}</small><div class="cd" data-t="${+m[4]}"></div><br><a class="btn mag" href="#mc" data-a="${m[0]}" data-b="${m[1]}">MATCH DETAILS</a></article>`).join('');

        $$('.bm a').forEach(a => a.onclick = () => match(+a.dataset.a, +a.dataset.b, 5));

        const tick = () => $$('.cd').forEach(e => { let s = Math.max(0, (+e.dataset.t - Date.now()) / 1e3); e.textContent = `${Math.floor(s / 86400)}G ${Math.floor(s % 86400 / 3600)}H ${Math.floor(s % 3600 / 60)}M ${Math.floor(s % 60)}S` }); tick(); setInterval(tick, 1e3);

        let cur = 4, filt = '';
        $('#chips').innerHTML = FX.map((_, r) => `<button role="tab" data-r="${r}">${r + 1}</button>`).join('');
        T.forEach((t, i) => $('#tf').add(new Option(t[0], i)));

        function renderCal() {
            if (location.hash === '#forma') openFormationBuilder();
            $$('#chips button').forEach(b => b.classList.toggle('on', +b.dataset.r == cur)); const d = date(cur); $('#dt').textContent = d ? `Giornata ${cur + 1} · ${fd(d)}` : `Giornata ${cur + 1}`;
            const ms = (R[cur] || []).filter(m => filt === '' || m[0] == filt || m[1] == filt), ml = $('#ml'); ml.style.animation = 'none'; void ml.offsetWidth; ml.style.animation = '';
            ml.innerHTML = ms.map(([a, b, x, y, dd]) => `<div class="mr cond" data-a="${a}" data-b="${b}"><b>${T[a][0]}${filt !== '' && a == filt ? ' <small>CASA</small>' : ''}</b><span class="sc">${x != null ? x + ' - ' + y : fd(dd).slice(-5)}</span><b style="text-align:left">${T[b][0]}${filt !== '' && b == filt ? ' <small>TRASFERTA</small>' : ''}<small>${T[a][2]} · ${x != null ? 'FINALE' : fd(dd).slice(0, -8)}</small></b></div>`).join('') || `<p style="color:#888;padding:20px">${R[cur] ? 'Nessuna partita per questa squadra.' : 'Dati ufficiali di questa giornata non ancora caricati.'}</p>`;
            $$('.mr').forEach(e => e.onclick = () => { match(+e.dataset.a, +e.dataset.b, cur); $('#mc').scrollIntoView() })
        }

        $('#chips').onclick = e => { if (e.target.dataset.r) { cur = +e.target.dataset.r; renderCal() } };
        $('#tf').onchange = e => { filt = e.target.value; renderCal() };

        const zone = k => k < 4 ? '#3dff9a' : k < 6 ? '#ff9a3d' : k == 6 ? '#3dc6ff' : k > 16 ? '#ff4d6a' : 'transparent';
        $('#tb').innerHTML = TB.map((z, k) => `<tr style="--z:${zone(k)}"><td>${k + 1}<td class="cond" style="font-size:18px">${T[z.i][0]}<td>${z.pg}<td>${z.v}<td>${z.n}<td>${z.p}<td>–<td>–<td>–<td class="pt">${z.pt}</tr>`).join('');

        const row = (l, u, v) => `<div class="sr"><div><span>${u}</span><span>${l}</span><span>${v}</span></div><div class="sb"><i style="--w:${u / (u + v || 1) * 100}%"></i><i style="--w:${v / (u + v || 1) * 100}%"></i></div></div>`;

        function match(a, b, r) {
            const m = (R[r] || []).find(z => z[0] == a && z[1] == b), ok = m && m[2] != null;
            $('#mh').innerHTML = `<span>${T[a][0]}</span><span class="num">${ok ? m[2] : '–'}</span><span style="color:#666">VS</span><span class="num">${ok ? m[3] : '–'}</span><span>${T[b][0]}</span>`;
            if (ok) $('#st').innerHTML = `<p style="text-align:center;color:#aaa">FINALE · ${fd(m[4])} · ${T[a][2]}<br><small>Possesso, tiri e xG non sono disponibili nel feed dati.</small></p>`;
            else { const p = m && m[5] || [33, 34, 33]; $('#st').innerHTML = `<p style="text-align:center;color:#aaa">Calcio d'inizio: ${m ? fd(m[4]) : ''} — ${T[a][2]}</p>${row('PROBABILITÀ VITTORIA %', p[0], p[2])}<p style="text-align:center;color:#888;font-size:13px">Pareggio ${p[1]}%</p>`; requestAnimationFrame(() => setTimeout(() => $$('.sb i').forEach(i => i.style.width = i.style.getPropertyValue('--w')), 50)) }
        }

        const SD = [["San Siro", "Milano", "Milan / Inter", "75.800 circa", "1926", "#c8102e", "Il Teatro: quattro anelli e le rampe elicoidali."], ["Olimpico", "Roma", "Roma / Lazio", "70.600 circa", "1953", "#8e1f2f", "Sotto la Curva Sud e la Nord, due città in una."], ["Allianz Stadium", "Torino", "Juventus", "41.500 circa", "2011", "#777", "Il primo grande stadio di proprietà in Italia."], ["Diego Armando Maradona", "Napoli", "Napoli", "54.700 circa", "1959", "#12a0d7", "Un coro unico, una città intera."], ["Gewiss Stadium", "Bergamo", "Atalanta", "25.000 circa", "1928", "#1e71b8", "Il piccolo grande stadio del calcio europeo."], ["Luigi Ferraris", "Genova", "Genoa", "33.200 circa", "1911", "#a31c2c", "Il più antico, nel cuore della città."]];

        $('#sl').innerHTML = SD.map(s => `<article class="sd" style="background:linear-gradient(160deg,${s[5]},#050505 80%)"><div class="lab">${s[1].toUpperCase()}</div><h3 class="cond">${s[0]}</h3><p>${s[6]}</p><div class="k"><span>CAPIENZA ${s[3]}</span><span>${s[4]}</span><span>${s[2]}</span></div></article>`).join('');

        const ST = { "Punti": z => z.pt, "Vittorie": z => z.v, "Pareggi": z => z.n, "Sconfitte (meno è meglio)": z => z.p };
        $('#tabs').innerHTML = Object.keys(ST).map(k => `<button data-k="${k}">${k}</button>`).join('');

        function bars(k) {
            $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.k == k)); const f = ST[k], l = [...TB].sort((a, b) => k.includes('meno') ? f(a) - f(b) : f(b) - f(a)).slice(0, 8), mx = Math.max(1, ...l.map(z => Math.abs(f(z))));
            $('#bars').innerHTML = l.map(z => `<div class="br"><span class="cond">${T[z.i][0]}</span><i data-w="${Math.abs(f(z)) / mx * 100}%"></i><b>${f(z)}</b></div>`).join(''); setTimeout(() => $$('.br i').forEach(i => i.style.width = i.dataset.w), 50)
        }

        $('#tabs').onclick = e => e.target.dataset.k && bars(e.target.dataset.k); bars("Punti");

        /* ---- EDITORIALE: card con contenuti ricavati dai dati del sito ---- */
        (() => {
            const li = (title, sub, right) => `<li><div><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>${right ? `<em>${right}</em>` : ''}</li>`;
            const findPlayer = name => {
                const n = normalizePlayerName(name);
                for (let i = 0; i < CLUB_SQUADS.length; i++)
                    for (const group of ['starters', 'alternatives'])
                        for (const [role, names] of Object.entries(CLUB_SQUADS[i][group] || {}))
                            if (names.split('|').some(x => normalizePlayerName(x) === n)) return { club: i, role };
                return null;
            };

            /* 1 · giovani talenti (nome, classe di nascita) */
            const young = [['Yildiz', 2005], ['Nico Paz', 2004], ['Pio Esposito', 2005], ['Mastantuono', 2007], ['Alajbegovic', 2007]];
            const youngRows = young.map(([name, year]) => {
                const f = findPlayer(name); if (!f) return '';
                return li(name, `${T[f.club][0]} · classe ${year}`, ROLE_SHORT[f.role]);
            }).join('');

            /* 2 · tattica: moduli delle 20 squadre */
            const mods = {}; CLUB_SQUADS.forEach(s => mods[s.formation] = (mods[s.formation] || 0) + 1);
            const mArr = Object.entries(mods).sort((a, b) => b[1] - a[1]);
            const tacRows = mArr.slice(0, 4).map(([m, n]) => `<li><div><b>${m}</b><div class="mb"><i style="width:${n / mArr[0][1] * 100}%"></i></div></div><em>${n} club</em></li>`).join('');

            /* 3 · derby: risultato o data dal calendario caricato */
            const derbies = [['INT', 'ACM', 'Derby della Madonnina'], ['ROM', 'LAZ', 'Derby della Capitale'], ['JUV', 'INT', "Derby d'Italia"], ['JUV', 'TOR', 'Derby della Mole']];
            let played = 0, planned = 0;
            const pos = t => TB.findIndex(z => z.i == t) + 1;
            const derbyRows = derbies.map(([a, b, name]) => {
                const A = ABB[a], B = ABB[b]; let hit = null;
                for (const r of Object.keys(R)) { const m = R[r].find(z => (z[0] == A && z[1] == B) || (z[0] == B && z[1] == A)); if (m) { hit = [+r, m]; break; } }
                const ranks = `${T[A][0]} ${pos(A)}° · ${T[B][0]} ${pos(B)}°`;
                if (!hit) return li(name, ranks, '');
                const m = hit[1], done = m[2] != null; done ? played++ : planned++;
                return li(name, `${ranks} · G${hit[0] + 1}`, done ? `${m[2]}–${m[3]}` : m[4].toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }));
            }).join('');
            const derbyText = played + planned
                ? `Quattro stracittadine da segnare in rosso: ${played} già giocate, ${planned} in programma, le altre in attesa del calendario.`
                : 'Quattro stracittadine da segnare in rosso: le date arrivano con il calendario, intanto ecco dove sono le due rivali in classifica.';

            /* 4 · tifoserie: i grandi stadi */
            const cap = s => +s[3].replace(/\D/g, '');
            const bySize = [...SD].sort((a, b) => cap(b) - cap(a));
            const fanRows = bySize.slice(0, 4).map(s => li(s[0], s[2], s[3].replace(' circa', ''))).join('');

            /* 5 · storia */
            const storyRows = [['1898', 'Primo campionato italiano, vince il Genoa'], ['1929/30', 'Nasce la Serie A a girone unico'], ['1934–38', 'Pozzo guida l’Italia a due Mondiali'], ['1994/95', 'Arrivano i tre punti per vittoria']].map(([y, t]) => li(t, '', y)).join('');

            /* 6 · città */
            const byCity = {}; T.forEach(t => (byCity[t[1]] = byCity[t[1]] || []).push(t[0]));
            const twin = Object.entries(byCity).filter(([, v]) => v.length > 1);
            const byStadium = {}; T.forEach(t => (byStadium[t[2]] = byStadium[t[2]] || []).push(t[0]));
            const shared = Object.entries(byStadium).filter(([, v]) => v.length > 1).map(([s]) => s);
            const cityRows = twin.map(([c, v]) => li(c, v.join(' · '), '×' + v.length)).join('') + li('Stadi condivisi', shared.join(' · '), shared.length);

            const E = [
                ['GIOVANI TALENTI', 'I volti della prossima generazione', '#1b3d22', 'Classi 2004-2007 già al centro dei progetti dei club: ecco chi seguire in questa stagione.', youngRows, ['carriera.html', 'CREA IL TUO TALENTO →']],
                ['TATTICA', 'Pressing, spazi e nuove linee', '#222', `Il ${mArr[0][0]} è il modulo più usato: ${mArr[0][1]} club su ${CLUB_SQUADS.length}, davanti al ${mArr[1][0]}.`, tacRows, ['#forma', 'PROVA I MODULI →']],
                ['DERBY', 'Quando la città si ferma', '#3a1218', derbyText, derbyRows, ['#cal', 'VAI AL CALENDARIO →']],
                ['TIFOSERIE', 'La voce delle curve', '#14305f', `Dai ${bySize[0][3].replace(' circa', '')} posti di ${bySize[0][0]} ai ${bySize.at(-1)[3].replace(' circa', '')} di ${bySize.at(-1)[0]}: sei templi, un solo coro.`, fanRows, ['#stadi', 'VISITA GLI STADI →']],
                ['STORIA', 'Da Pozzo a oggi', '#3a2f12', 'Dalla prima finale del 1898 alla Serie A a venti club: le date che hanno fatto il nostro calcio.', storyRows, ['#intro', 'TORNA AL CAMPIONATO →']],
                ['CITTÀ', 'Venti club, venti identità', '#12333a', `${Object.keys(byCity).length} città per ${T.length} club: ${twin.length} ne ospitano due e dividono il palcoscenico.`, cityRows, ['#teams', 'SCOPRI LE SQUADRE →']]
            ];
            $('#ed').innerHTML = E.map((e, i) => `<article class="ec rv" data-n="0${i + 1}" style="background:linear-gradient(160deg,${e[2]},#050505)"><span>${e[0]}</span><h3 class="cond">${e[1]}</h3><p>${e[3]}</p><ul>${e[4]}</ul><a class="ec-go" href="${e[5][0]}">${e[5][1]}</a></article>`).join('');
            $$('#ed a[href="#forma"]').forEach(a => a.addEventListener('click', ev => { ev.preventDefault(); openFormationBuilder(); }));
        })();

        $$('[data-w]').forEach(h => { const walk = n => [...n.childNodes].forEach(c => { if (c.nodeType == 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach((w, i) => { if (!w.trim()) return f.append(w); const s = document.createElement('span'); s.className = 'w'; s.textContent = w; s.style.transitionDelay = (i * .06) + 's'; f.append(s) }); c.replaceWith(f) } else walk(c) }); walk(h) });

        const io = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; e.target.classList.add('on'); e.target.querySelectorAll('[data-n]').forEach(n => { const t = +n.dataset.n, s = performance.now(); (function f(x) { const p = Math.min(1, (x - s) / 1500); n.textContent = Math.round(t * (1 - Math.pow(1 - p, 3))); p < 1 && requestAnimationFrame(f) })(s) }); io.unobserve(e.target) }), { threshold: .2 });
        $$('.rv').forEach(e => io.observe(e));

        let tk = 0; addEventListener('scroll', () => { if (tk) return; tk = 1; requestAnimationFrame(() => { const y = scrollY; $('#nav').classList.toggle('s', y > 40); if (y < innerHeight * 1.2) $$('[data-p]').forEach(e => e.style.transform = `translate3d(0,${y * e.dataset.p}px,0) scale(${1 + y / innerHeight * .15})`); tk = 0 }) }, { passive: true });
        const setNavMenuOpen = open => {
            $('#nav').classList.toggle('m', open);
            $('#bg').setAttribute('aria-expanded', String(open));
            $('#bg').setAttribute('aria-label', open ? 'Chiudi menu' : 'Apri menu');
            $('#bg').textContent = open ? '×' : '☰';
        };
        $('#bg').onclick = () => setNavMenuOpen(!$('#nav').classList.contains('m'));
        $$('#nav a').forEach(a => a.addEventListener('click', () => setNavMenuOpen(false)));
        if (formaLink) {
            formaLink.addEventListener('click', e => {
                e.preventDefault();
                setNavMenuOpen(false);
                openFormationBuilder();
            });
        }

        const c = $('#pc'), x = c.getContext('2d'); let ps = []; function rs() { c.width = c.offsetWidth; c.height = c.offsetHeight } rs(); addEventListener('resize', rs);
        for (let i = 0; i < (innerWidth < 700 ? 30 : 70); i++)ps.push({ x: Math.random() * c.width, y: Math.random() * c.height, v: .2 + Math.random() * .6, r: Math.random() * 1.8 });
        (function pl() { x.clearRect(0, 0, c.width, c.height); x.fillStyle = 'rgba(198,255,61,.55)'; ps.forEach(p => { p.y -= p.v; if (p.y < 0) { p.y = c.height; p.x = Math.random() * c.width } x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fill() }); requestAnimationFrame(pl) })();

        const cu = $('#cur'); addEventListener('pointermove', e => { cu.style.transform = `translate(${e.clientX - 7}px,${e.clientY - 7}px)` });
        $$('.mag').forEach(b => { b.onmousemove = e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.x - r.width / 2) * .25}px,${(e.clientY - r.y - r.height / 2) * .4}px)` }; b.onmouseleave = () => b.style.transform = '' });

        $('#enter').onclick = () => {
            const w = $('#wow'), t = $('#wt'); w.className = 'on'; t.className = 'cond'; document.body.style.overflow = 'hidden';
            try { const A = new AudioContext();[0, .5].forEach(d => { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = 55; g.gain.setValueAtTime(.4, A.currentTime + d); g.gain.exponentialRampToValueAtTime(.001, A.currentTime + d + .3); o.connect(g).connect(A.destination); o.start(A.currentTime + d); o.stop(A.currentTime + d + .3) }) } catch (e) { }
            setTimeout(() => t.classList.add('on'), 2200); setTimeout(() => w.classList.add('out'), 4300); setTimeout(() => { w.className = ''; document.body.style.overflow = ''; $('#intro').scrollIntoView() }, 5200)
        };

        const BK = 'sa_bet_v2'; let B = { cr: 1000, rd: DAY, bets: [] }; try { Object.assign(B, JSON.parse(localStorage.getItem(BK) || '{}')) } catch (e) { }
        const bsv = () => { try { localStorage.setItem(BK, JSON.stringify(B)) } catch (e) { } }; let slip = [];
        const MK = [['1', '1'], ['X', 'X'], ['2', '2'], ['U', 'U 2.5'], ['O', 'O 2.5'], ['GG', 'GOL'], ['NG', 'NOGOL']];
        const odds = (a, b) => { const p = R[5].find(z => z[0] == a && z[1] == b)[5], f = q => Math.max(1.05, +(.93 / q).toFixed(2)); return { '1': f(p[0] / 100), X: f(p[1] / 100), '2': f(p[2] / 100), U: f(.48), O: f(.52), GG: f(.54), NG: f(.46) } };
        const wins = (k, x, y) => k == '1' ? x > y : k == 'X' ? x == y : k == '2' ? x < y : k == 'U' ? x + y < 3 : k == 'O' ? x + y > 2 : k == 'GG' ? x > 0 && y > 0 : (x == 0 || y == 0);
        const eu = n => n.toFixed(2).replace('.', ',');

        function renderBet() {
            $('#bk').textContent = '€ ' + eu(B.cr); $('#bd').textContent = `Giornata ${B.rd + 1} · ${fd(date(B.rd))}`;
            $('#bmx').innerHTML = FX[5].map(([a, b], i) => { const o = odds(a, b); return `<div class="ev"><div class="cond"><span>${T[a][0]} - ${T[b][0]}</span><small>${T[a][2]}</small></div><div class="og">${MK.map(([k, l]) => `<button class="od${slip.some(z => z.i == i && z.k == k) ? ' on' : ''}" data-i="${i}" data-k="${k}"><b>${l}</b>${eu(o[k])}</button>`).join('')}</div></div>` }).join('');
            $('#sl2').innerHTML = slip.length ? slip.map((z, n) => `<div class="sel"><span>${T[z.a][0]}-${T[z.b][0]}<br><small style="color:var(--lime)">${MK.find(m => m[0] == z.k)[1]} @ ${eu(z.o)}</small></span><button data-x="${n}" aria-label="Rimuovi">✕</button></div>`).join('') : '<p style="color:#888;font-size:13px">Seleziona le quote per iniziare.</p>';
            const q = slip.reduce((p, z) => p * z.o, 1), st = Math.max(0, +$('#stk').value || 0); $('#pw').innerHTML = slip.length ? `Quota totale <b>${eu(q)}</b><br>Vincita potenziale <b>€ ${eu(q * st)}</b>` : '';
            $('#hist').innerHTML = B.bets.slice(0, 8).map(t => `<div class="hb ${t.st}"><b>${t.st == 'p' ? 'IN ATTESA' : t.st == 'w' ? 'VINTA' : 'PERSA'}</b> · G${t.rd + 1} · € ${eu(t.stake)} @ ${eu(t.odd)}${t.st == 'w' ? ' → € ' + eu(t.stake * t.odd) : ''}<br>${t.sel.map(z => `${T[z.a][0]}-${T[z.b][0]} ${MK.find(m => m[0] == z.k)[1]}${z.r ? ' (' + z.r + ')' : ''}`).join('<br>')}</div>`).join('') || '<p style="color:#888;font-size:13px">Nessuna schedina.</p>'
        }

        $('#bmx').onclick = e => { const b = e.target.closest('.od'); if (!b) return; const i = +b.dataset.i, k = b.dataset.k, [a, c] = FX[5][i], ex = slip.findIndex(z => z.i == i); if (ex >= 0) { const same = slip[ex].k == k; slip.splice(ex, 1); if (same) return renderBet() } slip.push({ i, k, a, b: c, o: odds(a, c)[k] }); renderBet() };
        $('#sl2').onclick = e => { if (e.target.dataset.x) { slip.splice(+e.target.dataset.x, 1); renderBet() } }; $('#stk').oninput = renderBet;
        $('#plc').onclick = () => {
            const st = Math.floor(+$('#stk').value || 0); if (!slip.length) return alert('Seleziona almeno un esito.'); if (st < 1 || st > B.cr) return alert('Puntata non valida: crediti disponibili € ' + eu(B.cr));
            B.cr -= st; B.bets.unshift({ rd: B.rd, stake: st, odd: +slip.reduce((p, z) => p * z.o, 1).toFixed(2), st: 'p', sel: slip.map(z => ({ a: z.a, b: z.b, k: z.k, o: z.o })) }); slip = []; bsv(); renderBet()
        };
        $('#sim').onclick = () => {
            let w = 0, n = 0; B.bets.forEach(t => { if (t.st != 'p' || t.rd != B.rd) return; n++; let ok = true; t.sel.forEach(z => { const [x, y] = simRes(z.a, z.b, B.rd); z.r = x + '-' + y; if (!wins(z.k, x, y)) ok = false }); t.st = ok ? 'w' : 'l'; if (ok) { B.cr += Math.round(t.stake * t.odd * 100) / 100; w++ } });
            alert(n ? `Giornata ${B.rd + 1} conclusa: ${w} schedine vinte su ${n}.` : `Nessuna schedina in gioco.`); B.rd = 5; slip = []; bsv(); renderBet()
        };
        $('#brs').onclick = () => { if (confirm('Azzerare crediti e storico?')) { B = { cr: 1000, rd: DAY, bets: [] }; slip = []; bsv(); renderBet() } };
        renderBet();
        renderCal(); match(15, 7, 4);
        if (location.hash === '#forma') openFormationBuilder();

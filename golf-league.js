/* ML Cup v1. Future scores and official tournament results belong in leagueData. */
const leagueData={
  players:[
    {id:'brent',name:'Brent Osgood',scores:[38,38,41,39,34,39,37,37,35,34],currentHandicap:-1},
    {id:'jackson',name:'Jackson Stupp',scores:[39,44,46,43,35,41,39,42,40],currentHandicap:5},
    {id:'mike',name:'Michael Ramos',scores:[41,43,48,48,38,35,40,44,40,44],currentHandicap:6},
    {id:'pat',name:'Pat Muia',scores:[42,41,50,46,43,38,44,43,41],currentHandicap:9},
    {id:'scott',name:'Scott Goodwin',scores:[48,52,43,42,43,47,41,50,38],currentHandicap:10},
    {id:'jr',name:'Israel Nieves',scores:[46,41,46,44,40,42,43,42],currentHandicap:11},
    {id:'tim',name:'Timothy Lynch',scores:[43,46,45,44,42,45,40,44,40],currentHandicap:11},
    {id:'chase',name:'Chase Campanella',scores:[44,50,51,48,52,44,46,46,49],currentHandicap:18},
    {id:'sammy',name:'Samuel Nieves',scores:[52,63,55,53,46,66,52],currentHandicap:28},
    {id:'shawn',name:'Shawn Gillispie',scores:[48,51,60,55,58],currentHandicap:27},
    {id:'kyle',name:'Kyle Beglan',scores:[58],currentHandicap:44}
  ],
  schedule:[
    {week:1,name:'WM Phoenix Open',course:'TPC Scottsdale',major:false,accent:'#168b73'},
    {week:2,name:'The PLAYERS Championship',course:'TPC Sawgrass',major:true,accent:'#176aa6'},
    {week:3,name:'Masters Tournament',course:'Bluejack National',major:true,accent:'#92751c'},
    {week:4,name:'Valero Texas Open',course:'TPC San Antonio',major:false,accent:'#bd6434'},
    {week:5,name:'PGA Championship',course:'Fields Ranch East',major:true,accent:'#125cad'},
    {week:6,name:'the Memorial Tournament',course:'Muirfield Village',major:false,accent:'#557043'},
    {week:7,name:'U.S. Open',course:'Pebble Beach',major:true,accent:'#ad2e38'},
    {week:8,name:'Travelers Championship',course:'TPC River Highlands',major:false,accent:'#b52b36'},
    {week:9,name:'John Deere Classic',course:'TPC Deere Run',major:false,accent:'#377d48'},
    {week:10,name:'The Open Championship',course:'St Andrews Old',major:true,accent:'#766c56'},
    {week:11,name:'3M Open',course:'TPC Twin Cities',major:false,accent:'#cf303e'},
    {week:12,name:'FedEx St. Jude Championship',course:'TPC Southwind',major:false,accent:'#5846a5'}
  ],
  results:{
    1:[
      {playerId:'scott',net:31},{playerId:'tim',net:33},{playerId:'brent',net:34},
      {playerId:'jr',net:36},{playerId:'pat',net:36},{playerId:'sammy',net:36},
      {playerId:'mike',net:37},{playerId:'jackson',net:37},{playerId:'chase',net:40},{playerId:'kyle',net:49}
    ]
  },
  points:{normal:[100,90,80,70,60,50,40,30,20,10],majorMultiplier:1.5},
  scoringPar:36
};

const playerMap=Object.fromEntries(leagueData.players.map(p=>[p.id,p]));
const eventMap=Object.fromEntries(leagueData.schedule.map(e=>[e.week,e]));

function countingScoreCount(rounds){if(rounds<8)return 0;if(rounds<=9)return 4;if(rounds<=11)return 5;if(rounds<=13)return 6;if(rounds<=15)return 7;return 8}
function calculateHandicap(scores,fallback){
  const count=countingScoreCount(scores.length);
  if(!count)return{value:fallback,average:null,counting:[]};
  const eligible=scores.length>=20?scores.slice(-20):scores.slice();
  const indexed=eligible.map((score,index)=>({score,index:index+scores.length-eligible.length}));
  const counting=indexed.slice().sort((a,b)=>a.score-b.score||a.index-b.index).slice(0,count);
  const average=counting.reduce((sum,item)=>sum+item.score,0)/count;
  return{value:Math.round((average-leagueData.scoringPar)*2),average,counting};
}
function pointValue(position,isMajor){const base=leagueData.points.normal[position-1]||0;return base*(isMajor?leagueData.points.majorMultiplier:1)}
function rankedResults(week){
  const event=eventMap[week],source=leagueData.results[week];if(!source)return[];
  const rows=source.map(r=>({...r,name:playerMap[r.playerId]?.name||r.playerId})).sort((a,b)=>a.net-b.net||a.name.localeCompare(b.name));
  rows.forEach((r,i)=>{r.position=i===0||r.net!==rows[i-1].net?i+1:rows[i-1].position});
  const totals=rows.reduce((m,r)=>(m[r.position]=(m[r.position]||0)+1,m),{});
  rows.forEach(r=>{r.positionLabel=(totals[r.position]>1?'T':'')+r.position;r.points=pointValue(r.position,event.major);r.toPar=r.net-leagueData.scoringPar});return rows;
}
function championFor(week){return rankedResults(week).find(r=>r.position===1)||null}
function isComplete(week){return Array.isArray(leagueData.results[week])&&leagueData.results[week].length>0}
function seasonStandings(){
  const stats=Object.fromEntries(leagueData.players.map(p=>[p.id,{...p,points:0,events:0,wins:0,top3:0,majorWins:0}]));
  leagueData.schedule.filter(e=>isComplete(e.week)).forEach(e=>rankedResults(e.week).forEach(r=>{const s=stats[r.playerId];if(!s)return;s.points+=r.points;s.events++;if(r.position===1){s.wins++;if(e.major)s.majorWins++}if(r.position<=3)s.top3++}));
  const rows=Object.values(stats).sort((a,b)=>b.points-a.points||b.wins-a.wins||a.name.localeCompare(b.name));
  rows.forEach((r,i)=>{r.rank=i===0||r.points!==rows[i-1].points?i+1:rows[i-1].rank});const ties=rows.reduce((m,r)=>(m[r.rank]=(m[r.rank]||0)+1,m),{});rows.forEach(r=>r.rankLabel=(ties[r.rank]>1?'T':'')+r.rank);return rows;
}
function signed(score){if(score===0)return'E';return score>0?`+${score}`:`${score}`}
function eventLogoPath(event){const extension=event.week===2?'jpg':event.week===8?'gif':'png';return`golf-assets/events/week-${String(event.week).padStart(2,'0')}.${extension}`}

function renderSchedule(){document.querySelector('#schedule-grid').innerHTML=leagueData.schedule.map(e=>{const champ=championFor(e.week);return`<article class="event-row ${e.major?'major':''}" style="--accent:${e.accent}" data-week="${e.week}"><div class="event-primary"><div class="week-number"><span>WEEK ${e.week}</span></div><div class="event-name">${e.name}<span class="row-arrow">›</span></div><div class="course">${e.course}</div></div><div class="event-seal"><img src="${eventLogoPath(e)}" alt="${e.name} logo"></div><div class="event-designation">${e.major?'<span class="major-mark">ML CUP MAJOR</span><span class="major-points">1.5X POINTS</span>':'<span class="event-points-label">ML CUP</span><span class="event-points-value">100 pts</span>'}</div><div class="event-status"><span class="status-label">${champ?'FINAL':'UPCOMING'}</span>${champ?`<div class="schedule-champion"><span>CHAMPION</span><strong>${champ.name}</strong><b>${signed(champ.toPar)}</b></div>`:''}</div></article>`}).join('')}
function renderHandicaps(){
  document.querySelector('#handicap-list').innerHTML=`<div class="handicap-header"><span>PLAYER</span><span>HANDICAP</span><span>ROUNDS</span><span>SELECTED AVG</span></div>${leagueData.players.map(p=>{const calc=calculateHandicap(p.scores,p.currentHandicap);const countingIndexes=new Set(calc.counting.map(x=>x.index));return`<details class="handicap-row"><summary><span class="player-name">${p.name}</span><strong class="handicap-number">${calc.value}</strong><span class="round-count">${p.scores.length}</span><span class="selected-average">${calc.average===null?'—':calc.average.toFixed(1)}</span><span class="expand-label">SCORES</span></summary><div class="score-detail"><div><strong>SCORE HISTORY</strong><small>Highlighted scores count toward the current handicap.</small></div><div class="score-chips">${p.scores.map((s,i)=>`<span class="score-chip ${countingIndexes.has(i)?'counting':''}">${s}</span>`).join('')}</div></div></details>`}).join('')}`}
function eventHero(e){return`<div class="event-hero" style="--accent:${e.accent}"><div class="event-seal hero-seal"><img src="${eventLogoPath(e)}" alt="${e.name} logo"></div><div class="event-title-block">${e.major?'<span class="major-mark">ML CUP MAJOR</span>':''}<h2>${e.name}</h2><p>${e.course}</p></div><div class="event-hero-meta"><span>WEEK ${e.week}</span><strong>${isComplete(e.week)?'FINAL':'UPCOMING'}</strong></div></div>`}
function renderResults(week){
  const e=eventMap[week],rows=rankedResults(week);let html=eventHero(e);
  if(!rows.length){html+='<div class="coming-soon"><strong>Results Coming Soon</strong><span>Official results will appear here after tournament play.</span></div>';document.querySelector('#event-results').innerHTML=html;return}
  const champ=rows[0];html+=`<div class="champion-feature"><div class="champion-label">${e.major?'MAJOR CHAMPION':'CHAMPION'}</div><div class="champion-name">${champ.name}</div><div class="champion-score">${signed(champ.toPar)}</div></div>`;
  html+=`<div class="table-shell"><div class="table-title">FINAL LEADERBOARD</div><table class="leaderboard"><thead><tr><th>Pos</th><th class="player">Player</th><th>Net</th><th>To Par</th><th>Points</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="position">${r.positionLabel}</td><td class="player">${r.name}</td><td class="net">${r.net}</td><td>${signed(r.toPar)}</td><td><strong>${r.points}</strong></td></tr>`).join('')}</tbody></table></div>`;document.querySelector('#event-results').innerHTML=html;
}
function renderPoints(){
  const rows=seasonStandings();document.querySelector('#leader-feature').innerHTML='';
  document.querySelector('#points-table').innerHTML=`<div class="table-shell standings-shell"><table class="leaderboard standings-table"><thead><tr class="group-head"><th></th><th>ML CUP RANK</th><th>ML CUP POINTS</th><th class="secondary-stat" colspan="4">SEASON PERFORMANCE</th></tr><tr><th class="player">Player</th><th>Official</th><th>Official</th><th class="secondary-stat">Events</th><th class="secondary-stat">Wins</th><th class="secondary-stat">Top 3</th><th class="secondary-stat">Major Wins</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td class="player"><span class="player-dot">${r.name[0]}</span>${r.name}${i===0?'<small class="leader-tag">ML CUP LEADER</small>':''}</td><td class="position">${r.rankLabel}</td><td class="points-value">${r.points}</td><td class="secondary-stat">${r.events}</td><td class="secondary-stat">${r.wins}</td><td class="secondary-stat">${r.top3}</td><td class="secondary-stat">${r.majorWins}</td></tr>`).join('')}</tbody></table></div>`;
}
function showView(id){document.querySelectorAll('.view,.nav-button').forEach(el=>el.classList.remove('active'));document.querySelector(`#${id}`).classList.add('active');document.querySelector(`[data-view="${id}"]`).classList.add('active');window.scrollTo({top:0,behavior:'smooth'})}
document.querySelectorAll('.nav-button').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelector('#event-selector').innerHTML=leagueData.schedule.map(e=>`<option value="${e.week}">Week ${e.week} — ${e.name}${e.major?' (Major)':''}</option>`).join('');
document.querySelector('#event-selector').addEventListener('change',e=>renderResults(Number(e.target.value)));
document.querySelector('#schedule-grid').addEventListener('click',e=>{const card=e.target.closest('[data-week]');if(!card)return;const week=Number(card.dataset.week);document.querySelector('#event-selector').value=week;renderResults(week);showView('results')});
renderSchedule();renderHandicaps();renderResults(1);renderPoints();

// ⚙️ Firebase Config
firebase.initializeApp({
  apiKey: "...", authDomain: "...",
  projectId: "...", databaseURL: "..."
});
const db = firebase.database();

// عناصر UI
const loginScreen = document.getElementById("loginScreen");
const gameScreen  = document.getElementById("gameScreen");
const gridEl = document.getElementById("grid");
const roomTitle = document.getElementById("roomTitle");
const turnInfo = document.getElementById("turnInfo");
const winnerDiv = document.getElementById("winner");

let playerName = "", roomId = "", playerSymbol = "", isMyTurn = false;

function joinGame(){
  playerName = nameInput.value.trim();
  roomId = roomInput.value.trim();
  if(!playerName || !roomId) return alert("Isi nama & ID ruangan");

  loginScreen.classList.remove("screen-active");
  gameScreen.classList.add("screen-active");
  roomTitle.textContent = `Ruangan: ${roomId}`;

  const ref = db.ref("rooms/"+roomId);
  ref.once("value", snap => {
    const data = snap.val();
    if(!data){
      ref.set({ players:{p1:playerName}, board:Array(100).fill(""), turn:"X", status:"waiting" });
      playerSymbol="X"; isMyTurn=true;
    } else {
      if(data.players.p2) return alert("Ruangan penuh!");
      ref.update({ "players/p2":playerName, status:"playing" });
      playerSymbol="O"; isMyTurn=false;
    }
    listenRoom(ref);
  });
}

function listenRoom(ref){
  ref.on("value", snap=>{
    const d = snap.val(); if(!d||!d.board) return;
    drawGrid(d.board);
    if(d.status==="playing"){
      turnInfo.textContent = d.turn===playerSymbol?"Giliran Kamu":"Menunggu lawan";
      isMyTurn = d.turn===playerSymbol;
    }
    if(d.winner) winnerDiv.textContent = `🎉 ${d.winner} menang!`;
  });
}

function drawGrid(board){
  gridEl.innerHTML="";
  board.forEach((c,i)=>{
    const div = document.createElement("div");
    div.className="cell";
    div.textContent = c==="X"?"❤️":c==="O"?"💛":"";
    div.onclick = ()=>makeMove(i, board);
    gridEl.appendChild(div);
  });
}

function makeMove(i, board){
  if(!isMyTurn || board[i]!="" || winnerDiv.textContent) return;
  board[i]=playerSymbol;
  const next = playerSymbol==="X"?"O":"X";
  const win = checkWin(board);
  db.ref("rooms/"+roomId).update({board, turn:next, winner:win||""});
}

function checkWin(b){
  const dirs=[1,10,11,9];
  for(let r=0;r<100;r++){
    if(!b[r])continue;
    for(let d of dirs){
      let cnt=1, i=r+d;
      while(i<100 && b[i]===b[r]){cnt++; i+=d;}
      i=r-d;
      while(i>=0&&b[i]===b[r]){cnt++; i-=d;}
      if(cnt>=6) return playerSymbol;
    }
  }
  return "";
}
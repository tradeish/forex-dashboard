var FX_URL="https://script.google.com/macros/s/AKfycbx_SNdibXwwzJj7A4ZG-LKHHLvTO8PgfWt65jAwwg7KwQ3RvPfJ4B4VK6VJPYDhi_kB/exec";
var FX_PAIRS={XAUUSD:{label:"XAU / USD",cat:"Commodities - Gold",tv:"OANDA:XAUUSD"},USOIL:{label:"WTI Oil",cat:"Commodities - Oil",tv:"OANDA:WTICOUSD"},EURUSD:{label:"EUR / USD",cat:"Forex - Major",tv:"OANDA:EURUSD"},GBPUSD:{label:"GBP / USD",cat:"Forex - Major",tv:"OANDA:GBPUSD"},USDJPY:{label:"USD / JPY",cat:"Forex - Major",tv:"OANDA:USDJPY"},USDCHF:{label:"USD / CHF",cat:"Forex - Major",tv:"OANDA:USDCHF"},USDCAD:{label:"USD / CAD",cat:"Forex - Major",tv:"OANDA:USDCAD"},AUDUSD:{label:"AUD / USD",cat:"Forex - Major",tv:"OANDA:AUDUSD"},NZDUSD:{label:"NZD / USD",cat:"Forex - Major",tv:"OANDA:NZDUSD"},EURJPY:{label:"EUR / JPY",cat:"Forex - Cross",tv:"OANDA:EURJPY"},GBPJPY:{label:"GBP / JPY",cat:"Forex - Cross",tv:"OANDA:GBPJPY"},EURGBP:{label:"EUR / GBP",cat:"Forex - Cross",tv:"OANDA:EURGBP"},CADJPY:{label:"CAD / JPY",cat:"Forex - Cross",tv:"OANDA:CADJPY"},NZDJPY:{label:"NZD / JPY",cat:"Forex - Cross",tv:"OANDA:NZDJPY"}};
var FX_COLORS=["#c9a84c","#4aaa4a","#5a8adc","#cc5555","#aa7acc","#5abaaa","#dc8a5a","#8adc5a","#dc5aaa","#5adcdc","#dcdc5a","#aa5a5a","#5a5adc","#aa8a5a"];
var fxLive=[],fxHist=[],fxStats={},fxPlChart=null,fxDonut=null,fxPie=null,fxTab="1M",fxTvDone={},fxCbN=0;

function fxTick(){
  var n=new Date();
  var h=n.getUTCHours(),m=n.getUTCMinutes(),s=n.getUTCSeconds();
  var pad=function(x){return x<10?"0"+x:x};
  var el=document.getElementById("fx-utc");
  if(el)el.textContent=pad(h)+":"+pad(m)+":"+pad(s)+" UTC";
  var t=h*60+m;
  var se=document.getElementById("fx-session");
  if(!se)return;
  if(t>=480&&t<540){se.className="fx-session";se.textContent="OVERLAP SESSION";}
  else if(t>=480&&t<780){se.className="fx-session";se.textContent="LONDON SESSION";}
  else if(t>=780&&t<960){se.className="fx-session";se.textContent="NEW YORK SESSION";}
  else if(t>=0&&t<480||t>=1380){se.className="fx-session";se.textContent="TOKYO SESSION";}
  else{se.className="fx-session off";se.textContent="MARKET CLOSED";}
}

function fxGfetch(type){
  return new Promise(function(res,rej){
    var cb="_fxcb"+(++fxCbN);
    var sc=document.createElement("script");
    var tm=setTimeout(function(){clearTimeout(tm);delete window[cb];if(sc.parentNode)sc.parentNode.removeChild(sc);rej("timeout");},10000);
    window[cb]=function(d){clearTimeout(tm);delete window[cb];if(sc.parentNode)sc.parentNode.removeChild(sc);res(d);};
    sc.src=FX_URL+"?type="+type+"&callback="+cb+"&t="+Date.now();
    sc.onerror=function(){clearTimeout(tm);delete window[cb];if(sc.parentNode)sc.parentNode.removeChild(sc);rej("err");};
    document.head.appendChild(sc);
  });
}

function fxLoadTV(pair,symbol){
  if(fxTvDone[pair])return;
  fxTvDone[pair]=true;
  var el=document.getElementById("tv-"+pair);
  if(!el)return;
  var isDark=document.body.classList.contains("drK")||!!document.querySelector(".drK");
  var theme=isDark?"dark":"light";
  var container=document.createElement("div");
  container.className="tradingview-widget-container";
  container.style.cssText="height:140px;width:100%;";
  var inner=document.createElement("div");
  inner.className="tradingview-widget-container__widget";
  container.appendChild(inner);
  el.appendChild(container);
  var cfg=document.createElement("script");
  cfg.type="application/json";
  cfg.text='{"symbol":"'+symbol+'","width":"100%","height":140,"locale":"en","dateRange":"1D","colorTheme":"'+theme+'","isTransparent":true,"autosize":false,"chartType":"area","noTimeScale":false}';
  container.appendChild(cfg);
  var sc=document.createElement("script");
  sc.src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
  sc.async=true;
  container.appendChild(sc);
}

function fxMakeCard(s){
  var info=FX_PAIRS[s.pair]||{label:s.pair,cat:"",tv:s.pair};
  var st=s.status.toUpperCase();
  var isA=st==="ACTIVE",isC=st==="CLOSED";
  var act=s.action.toUpperCase();
  var card=document.createElement("div");
  card.className="fx-card"+(isA?" active":isC?" closed":"");
  var pillCls="fx-pill"+(isA?" active":isC?" closed":"");
  var pillTxt=(isA?"* ":"")+st;
  var actCls="fx-action"+(act==="BUY"?" buy":act==="SELL"?" sell":"");
  var actTxt=act==="BUY"?"BUY":act==="SELL"?"SELL":"WAITING";
  var html="<div class='fx-card-inner'>";
  html+="<div class='fx-chart-side'><div class='fx-chart-lbl'>TRADINGVIEW LIVE</div><div class='fx-tv' id='tv-"+s.pair+"'></div></div>";
  html+="<div class='fx-data'>";
  html+="<div class='fx-data-head'><div><div class='fx-pair-name'>"+info.label+"</div><div class='fx-pair-cat'>"+info.cat+"</div></div><div class='"+pillCls+"'>"+pillTxt+"</div></div>";
  html+="<div class='fx-cells'>";
  html+="<div class='fx-cell'><div class='fx-cell-l'>Entry</div><div class='fx-cell-v "+(s.entry?"entry":"empty")+"'>"+(s.entry||"--")+"</div></div>";
  html+="<div class='fx-cell'><div class='fx-cell-l'>Take Profit</div><div class='fx-cell-v "+(s.tp?"tp":"empty")+"'>"+(s.tp||"--")+"</div></div>";
  html+="<div class='fx-cell'><div class='fx-cell-l'>Stop Loss</div><div class='fx-cell-v "+(s.sl?"sl":"empty")+"'>"+(s.sl||"--")+"</div></div>";
  html+="<div class='fx-cell'><div class='fx-cell-l'>Open Time</div><div class='fx-cell-v "+(s.openTime?"time":"empty")+"'>"+(s.openTime||"--")+"</div></div>";
  html+="</div>";
  html+="<div class='fx-foot'><div class='"+actCls+"'>"+actTxt+"</div><div class='fx-running'>"+(isA?"RUNNING":"")+"</div></div>";
  if(isC){html+="<div class='fx-result show'><div class='fx-res-txt win'>CLOSED"+(s.closePrice?" @ "+s.closePrice:"")+"</div><div class='fx-close-t'>"+(s.openTime||"")+"</div></div>";}
  html+="</div></div>";
  card.innerHTML=html;
  return card;
}

function fxRenderCards(){
  var wrap=document.getElementById("fx-cards");
  if(!wrap)return;
  wrap.innerHTML="";
  if(!fxLive.length){wrap.innerHTML="<div class='fx-empty' style='border:0.5px solid var(--bd);border-radius:8px'>No active signals</div>";return;}
  for(var i=0;i<fxLive.length;i++){
    var card=fxMakeCard(fxLive[i]);
    wrap.appendChild(card);
    fxLoadTV(fxLive[i].pair,(FX_PAIRS[fxLive[i].pair]||{tv:fxLive[i].pair}).tv);
  }
  var activeN=0;
  for(var j=0;j<fxLive.length;j++){if(fxLive[j].status.toUpperCase()==="ACTIVE")activeN++;}
  var ael=document.getElementById("fx-active");
  if(ael)ael.textContent=activeN;
}

function fxRenderHist(){
  var tb=document.getElementById("fx-hist");
  if(!tb)return;
  if(!fxHist.length){tb.innerHTML="<tr><td colspan='8' class='fx-empty'>No closed trades yet</td></tr>";return;}
  var html="";
  for(var i=0;i<fxHist.length;i++){
    var h=fxHist[i];
    var w=h.result&&h.result.indexOf("TP")>-1;
    var dc=h.action==="BUY"?"buy":"sell";
    var rc=w?"win":"loss";
    var pn=parseInt(h.pips)||0;
    html+="<tr><td class='muted'>"+h.closeDateTime+"</td><td class='pair'>"+h.pair+"</td><td class='"+dc+"'>"+h.action+"</td><td>"+h.entry+"</td><td>"+h.closePrice+"</td><td class='"+rc+"'>"+(pn>0?"+"+pn:pn)+"</td><td class='"+rc+"'>"+h.gainLoss+"</td><td class='"+rc+"'>"+(w?"TP HIT":"SL HIT")+"</td></tr>";
  }
  tb.innerHTML=html;
}

function fxRenderStats(){
  var s=fxStats;
  if(!s||!s.total)return;
  var te=document.getElementById("fx-total");if(te)te.textContent=s.total;
  var we=document.getElementById("fx-wr");if(we)we.textContent=s.winRate+"%";
  var pe=document.getElementById("fx-pips");
  if(pe){pe.textContent=(s.netPips>=0?"+":"")+s.netPips;pe.className="fx-stat-v "+(s.netPips>=0?"g":"r");}
}

function fxRenderDonut(){
  var s=fxStats;
  if(!s||!s.pairCount)return;
  var pairs=Object.keys(s.pairCount).sort(function(a,b){return s.pairCount[b]-s.pairCount[a]});
  if(!pairs.length)return;
  var counts=pairs.map(function(p){return s.pairCount[p]});
  var colors=pairs.map(function(_,i){return FX_COLORS[i%FX_COLORS.length]});
  var total=counts.reduce(function(a,b){return a+b},0);
  var ctx=document.getElementById("fx-donut");
  if(!ctx)return;
  if(fxDonut)fxDonut.destroy();
  fxDonut=new Chart(ctx.getContext("2d"),{type:"doughnut",data:{labels:pairs,datasets:[{data:counts,backgroundColor:colors.map(function(c){return c+"bb"}),borderColor:colors.map(function(c){return c+"33"}),borderWidth:1,hoverOffset:4}]},options:{responsive:false,cutout:"65%",plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return " "+c.label+": "+c.raw+" ("+Math.round(c.raw/total*100)+"%)"}},backgroundColor:"rgba(0,0,0,0.8)",bodyColor:"#aaa",borderColor:"rgba(255,255,255,0.1)",borderWidth:1}}}});
  var legEl=document.getElementById("fx-dleg");
  if(!legEl)return;
  var legHtml="";
  var max=Math.min(pairs.length,6);
  for(var i=0;i<max;i++){legHtml+="<div class='fx-dleg-row'><div class='fx-dleg-l'><div class='fx-dot' style='background:"+colors[i]+"'></div>"+pairs[i]+"</div><div>"+Math.round(counts[i]/total*100)+"%</div></div>";}
  legEl.innerHTML=legHtml;
}

function fxRenderPie(){
  var s=fxStats;if(!s)return;
  var w=s.wins||0,l=s.losses||0;
  var ps=document.getElementById("fx-pie-stat");
  if(ps)ps.textContent=w+"W / "+l+"L  "+(s.winRate||0)+"% win rate";
  var ctx=document.getElementById("fx-pie");if(!ctx)return;
  if(fxPie)fxPie.destroy();
  fxPie=new Chart(ctx.getContext("2d"),{type:"doughnut",data:{labels:["TP Hit","SL Hit"],datasets:[{data:[w||0.001,l],backgroundColor:["rgba(74,170,74,0.75)","rgba(204,85,85,0.75)"],borderColor:["rgba(74,170,74,0.3)","rgba(204,85,85,0.3)"],borderWidth:1,hoverOffset:4}]},options:{responsive:false,cutout:"65%",plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return " "+c.label+": "+c.raw}},backgroundColor:"rgba(0,0,0,0.8)",bodyColor:"#aaa",borderColor:"rgba(255,255,255,0.1)",borderWidth:1}}}});
}

function fxSetTab(t){
  fxTab=t;
  var tabs=document.querySelectorAll(".fx-tab");
  for(var i=0;i<tabs.length;i++){tabs[i].classList.toggle("on",tabs[i].textContent===t);}
  fxRenderPL();
}

function fxRenderPL(){
  var dmap={"1D":1,"5D":5,"1M":30,"6M":180,"ALL":99999};
  var d=dmap[fxTab]||30;
  var cutoff=Date.now()-d*864e5;
  var rows=[];
  for(var i=0;i<fxHist.length;i++){
    var r=fxHist[i];
    if(fxTab==="ALL"){rows.push(r);continue;}
    try{
      var p=r.closeDateTime.split(" ")[0].split("/");
      var tp2=r.closeDateTime.split(" ")[1]?r.closeDateTime.split(" ")[1].split(":"):[0,0];
      var dt=new Date(Date.UTC(new Date().getFullYear(),parseInt(p[1])-1,parseInt(p[0]),parseInt(tp2[0]),parseInt(tp2[1]))).getTime();
      if(dt>=cutoff)rows.push(r);
    }catch(e){rows.push(r);}
  }
  var cum=0,labels=[],vals=[];
  for(var j=rows.length-1;j>=0;j--){cum+=parseInt(rows[j].pips)||0;labels.push(rows[j].closeDateTime.split(" ")[0]||j+1);vals.push(cum);}
  var el=document.getElementById("fx-pl-total");
  if(el){el.textContent=(cum>=0?"+":"")+cum+" PIP";el.style.color=cum>=0?"var(--gr)":"var(--rd)";}
  var lc=cum>=0?"rgba(74,170,74,0.8)":"rgba(204,85,85,0.8)";
  var fc=cum>=0?"rgba(74,170,74,0.08)":"rgba(204,85,85,0.08)";
  var ctx=document.getElementById("fx-pl");if(!ctx)return;
  if(fxPlChart)fxPlChart.destroy();
  fxPlChart=new Chart(ctx.getContext("2d"),{type:"line",data:{labels:labels.length?labels:["--"],datasets:[{data:vals.length?vals:[0],borderColor:lc,backgroundColor:fc,borderWidth:1.5,fill:true,tension:0.4,pointRadius:2,pointBackgroundColor:lc}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:"rgba(128,128,128,0.5)",font:{size:9,family:"Share Tech Mono"},maxTicksLimit:8},grid:{color:"rgba(128,128,128,0.06)"}},y:{ticks:{color:"rgba(128,128,128,0.5)",font:{size:9,family:"Share Tech Mono"}},grid:{color:"rgba(128,128,128,0.06)"}}}}});
}

function fxRenderPipBars(){
  var s=fxStats;if(!s||!s.pairPips)return;
  var pairs=Object.keys(s.pairPips).sort(function(a,b){return s.pairPips[b]-s.pairPips[a]});
  if(!pairs.length)return;
  var maxA=1;
  for(var i=0;i<pairs.length;i++){if(Math.abs(s.pairPips[pairs[i]])>maxA)maxA=Math.abs(s.pairPips[pairs[i]]);}
  var html="";
  for(var j=0;j<pairs.length;j++){
    var p=pairs[j],v=s.pairPips[p],pos=v>=0,pct=Math.round(Math.abs(v)/maxA*100),col=pos?"var(--gr)":"var(--rd)";
    html+="<div class='fx-pip-row'><div class='fx-pip-lbl'>"+p+"</div><div class='fx-pip-out'><div class='fx-pip-in' style='width:"+pct+"%;background:"+col+"'></div></div><div class='fx-pip-val' style='color:"+col+"'>"+(pos?"+":"")+v+"</div></div>";
  }
  var pb=document.getElementById("fx-pipbars");if(pb)pb.innerHTML=html;
}

function fxFetchLive(){
  fxGfetch("live").then(function(d){
    fxLive=Array.isArray(d)?d:[];
    fxRenderCards();
  }).catch(function(e){console.warn("live",e);});
}

function fxFetchHist(){
  fxGfetch("history").then(function(d){
    fxHist=Array.isArray(d)?d:[];
    fxRenderHist();
    fxRenderPL();
  }).catch(function(e){console.warn("hist",e);});
}

function fxFetchStats(){
  fxGfetch("stats").then(function(d){
    fxStats=d||{};
    fxRenderStats();
    fxRenderDonut();
    fxRenderPie();
    fxRenderPipBars();
  }).catch(function(e){console.warn("stats",e);});
}

fxTick();
setInterval(fxTick,1000);
fxFetchLive();
fxFetchHist();
fxFetchStats();
setInterval(fxFetchLive,15000);
setInterval(fxFetchHist,60000);
setInterval(fxFetchStats,60000);

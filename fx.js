var FX_URL="https://script.google.com/macros/s/AKfycbx_SNdibXwwzJj7A4ZG-LKHHLvTO8PgfWt65jAwwg7KwQ3RvPfJ4B4VK6VJPYDhi_kB/exec";
var FX_PAIRS={
  XAUUSD:{label:"XAU / USD",cat:"Commodities - Gold",tv:"TVC:GOLD"},
  USOIL:{label:"WTI Oil",cat:"Commodities - Oil",tv:"TVC:USOIL"},
  EURUSD:{label:"EUR / USD",cat:"Forex - Major",tv:"FX:EURUSD"},
  GBPUSD:{label:"GBP / USD",cat:"Forex - Major",tv:"FX:GBPUSD"},
  USDJPY:{label:"USD / JPY",cat:"Forex - Major",tv:"FX:USDJPY"},
  USDCHF:{label:"USD / CHF",cat:"Forex - Major",tv:"FX:USDCHF"},
  USDCAD:{label:"USD / CAD",cat:"Forex - Major",tv:"FX:USDCAD"},
  AUDUSD:{label:"AUD / USD",cat:"Forex - Major",tv:"FX:AUDUSD"},
  NZDUSD:{label:"NZD / USD",cat:"Forex - Major",tv:"FX:NZDUSD"},
  EURJPY:{label:"EUR / JPY",cat:"Forex - Cross",tv:"FX:EURJPY"},
  GBPJPY:{label:"GBP / JPY",cat:"Forex - Cross",tv:"FX:GBPJPY"},
  EURGBP:{label:"EUR / GBP",cat:"Forex - Cross",tv:"FX:EURGBP"},
  CADJPY:{label:"CAD / JPY",cat:"Forex - Cross",tv:"FX:CADJPY"},
  NZDJPY:{label:"NZD / JPY",cat:"Forex - Cross",tv:"FX:NZDJPY"}
};
var FX_RELATED_LABELS = {
  XAUUSD: ["Gold Forecast","Gold Daily Analysis","Gold News","XAUUSD Strategy"],
  USOIL:  ["USOIL Update"],
  EURUSD: ["EURUSD Update"],
  GBPUSD: ["GBPUSD Update"],
  USDJPY: ["Major Pairs"],
  USDCHF: ["Major Pairs"],
  USDCAD: ["Major Pairs"],
  AUDUSD: ["Major Pairs"],
  NZDUSD: ["Major Pairs"],
  EURJPY: ["Minor Pairs"],
  GBPJPY: ["Minor Pairs"],
  EURGBP: ["Minor Pairs"],
  CADJPY: ["Minor Pairs"],
  NZDJPY: ["Minor Pairs"]
};

var FX_BLOG = "https://www.tradingwithishaan.com";
var fxRelatedLoaded = {};

function fxLoadRelated(pair){
  if(fxRelatedLoaded[pair])return;
  var labels = FX_RELATED_LABELS[pair];
  if(!labels||!labels.length)return;

  var relEl = document.getElementById("related-"+pair);
  if(relEl) relEl.style.display = "";

  // Try first label
  fxFetchRelatedLabel(pair, labels, 0);
}

function fxFetchRelatedLabel(pair, labels, idx){
  if(idx >= labels.length){
    // Tried every label for this pair and found nothing usable — hide the
    // box instead of leaving it looking broken (empty title/desc, dead link)
    var relEl = document.getElementById("related-"+pair);
    if(relEl) relEl.style.display = "none";
    return;
  }
  var label = labels[idx];
  var url = FX_BLOG+"/feeds/posts/summary/-/"+encodeURIComponent(label)+"?alt=json&max-results=1";
  
  var sc = document.createElement("script");
  var cbName = "_fxrel_"+pair+"_"+idx;
  var done = false;

  // If the request hangs (no callback AND no error event — this can happen
  // if the feed responds with something that isn't valid JS, e.g. during a
  // temporary rate-limit), don't get stuck forever — move on after 8s.
  var tm = setTimeout(function(){
    if(done)return;
    done = true;
    if(sc.parentNode)sc.parentNode.removeChild(sc);
    delete window[cbName];
    fxFetchRelatedLabel(pair, labels, idx+1);
  }, 8000);

  window[cbName] = function(data){
    if(done)return;
    done = true;
    clearTimeout(tm);
    if(sc.parentNode)sc.parentNode.removeChild(sc);
    delete window[cbName];
    try{
      var entries = data.feed.entry;
      if(entries && entries.length > 0){
        fxShowRelated(pair, entries[0]);
        fxRelatedLoaded[pair] = true;
      } else {
        // Try next label
        fxFetchRelatedLabel(pair, labels, idx+1);
      }
    }catch(e){
      fxFetchRelatedLabel(pair, labels, idx+1);
    }
  };
  sc.src = url + "&callback="+cbName;
  sc.onerror = function(){
    if(done)return;
    done = true;
    clearTimeout(tm);
    if(sc.parentNode)sc.parentNode.removeChild(sc);
    delete window[cbName];
    fxFetchRelatedLabel(pair, labels, idx+1);
  };
  (document.head||document.body||document.documentElement).appendChild(sc);
}

function fxShowRelated(pair, entry){
  var relDiv = document.getElementById("related-"+pair);
  if(!relDiv)return;

  // Get title
  var title = entry.title ? entry.title.$t : "";
  
  // Get link
  var link = "#";
  if(entry.link){
    for(var i=0;i<entry.link.length;i++){
      if(entry.link[i].rel==="alternate"){link=entry.link[i].href;break;}
    }
  }
  
  // Get image (HD) - same logic as the blog theme's own related-posts widget:
  // prefer the full content image over the small thumbnail, then force high resolution
  var imgUrl = "";
  var rawHtml = "";
  if(entry.content && entry.content.$t){
    rawHtml = entry.content.$t;
  } else if(entry.summary && entry.summary.$t){
    rawHtml = entry.summary.$t;
  }
  var imgMatch = rawHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if(imgMatch && imgMatch[1]){
    imgUrl = imgMatch[1];
  }
  if(!imgUrl && entry.media$thumbnail && entry.media$thumbnail.url){
    imgUrl = entry.media$thumbnail.url;
  }
  if(imgUrl){
    imgUrl = imgUrl
      .replace(/\/s[0-9]+(\-c)?\//g, "/s1200/")
      .replace(/=s[0-9]+(\-c)?/g, "=s1200")
      .replace(/\/w[0-9]+\-h[0-9]+\-p\-k\-no\-nu\//g, "/s1200/")
      .replace(/=w[0-9]+\-h[0-9]+\-p\-k\-no\-nu/g, "=s1200");
  }
  
  // Get description

  var desc = "";
  if(entry.summary){
    desc = entry.summary.$t.replace(/<[^>]+>/g,"").substring(0,80)+"...";
  } else if(entry.content){
    desc = entry.content.$t.replace(/<[^>]+>/g,"").substring(0,80)+"...";
  }

  // Update DOM
  relDiv.href = link;
  relDiv.className = "fx-related show";

  var imgEl = document.getElementById("related-img-"+pair);
  if(imgEl){
    if(imgUrl){
      var img = document.createElement("img");
      img.className = "fx-related-img";
      img.id = "related-img-"+pair;
      img.src = imgUrl;
      img.alt = title;
      img.loading = "lazy";
      img.style.setProperty("width","100px","important");
      img.style.setProperty("height","74px","important");
      img.style.setProperty("max-width","100px","important");
      img.style.setProperty("max-height","74px","important");
      img.style.setProperty("object-fit","cover","important");
      img.style.setProperty("border-radius","5px","important");
      imgEl.parentNode.replaceChild(img, imgEl);
    }
  }

  var titleEl = document.getElementById("related-title-"+pair);
  if(titleEl)titleEl.textContent = title;

  // Get published date in UTC
  var dateStr = "";
  if(entry.published){
    try{
      var dt = new Date(entry.published.$t);
      var pad = function(n){return n<10?"0"+n:n;};
      dateStr = pad(dt.getUTCDate())+"/"+pad(dt.getUTCMonth()+1)+"/"+dt.getUTCFullYear()
        +" "+pad(dt.getUTCHours())+":"+pad(dt.getUTCMinutes())+" UTC";
    }catch(e){}
  }

  var descEl = document.getElementById("related-desc-"+pair);
  if(descEl)descEl.textContent = (dateStr ? "🕐 "+dateStr+"  " : "") + desc;
}

var FX_COLORS=["#c9a84c","#4aaa4a","#5a8adc","#cc5555","#aa7acc","#5abaaa","#dc8a5a","#8adc5a","#dc5aaa","#5adcdc","#dcdc5a","#aa5a5a","#5a5adc","#aa8a5a"];
var fxLive=[],fxHist=[],fxStats={},fxPlChart=null,fxDonut=null,fxPie=null,fxTab="1M",fxCbN=0;
var fxHistShown=5;

function fxTick(){
  var n=new Date();
  var h=n.getUTCHours(),m=n.getUTCMinutes(),s=n.getUTCSeconds();
  var pad=function(x){return x<10?"0"+x:x};
  var el=document.getElementById("fx-utc");
  if(el)el.textContent=pad(h)+":"+pad(m)+":"+pad(s)+" UTC";
  var t=h*60+m;
  var se=document.getElementById("fx-session");

  var day=n.getUTCDay(); // 0=Sun, 6=Sat
  var isWeekend=(day===0||(day===5&&t>=1320)||(day===6));

  // Market open/closed/weekend
  var mkt=document.getElementById("fx-mkt-status");
  if(mkt){
    if(isWeekend){
      mkt.textContent="WEEKEND CLOSED";
      mkt.className="fx-mkt-weekend";
    } else if(t>=0&&t<1320){
      mkt.textContent="MARKET OPEN";
      mkt.className="fx-mkt-open";
    } else {
      mkt.textContent="MARKET CLOSED";
      mkt.className="fx-mkt-closed";
    }
  }

  if(!se)return;

  if(isWeekend){
    se.className="fx-session off";
    se.textContent="WEEKEND CLOSED";
  }
  else if(t>=480&&t<540){se.className="fx-session";se.textContent="OVERLAP SESSION";}
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
    (document.head||document.body||document.documentElement).appendChild(sc);
  });
}

function fxUpdateCard(s,key){
  key = key || s.pair;
  var st=s.status.toUpperCase();
  var isA=st==="ACTIVE",isC=st==="CLOSED";
  var act=s.action.toUpperCase();

  var card=document.getElementById("card-"+key);
  if(!card)return;
  card.style.display="block";
  card.className="fx-card"+(isA?" active":isC?" closed":"");

  var pill=document.getElementById("pill-"+key);
  if(pill){pill.textContent=(isA?"* ":"")+st;pill.className="fx-pill"+(isA?" active":isC?" closed":"");}

  var eEl=document.getElementById("entry-"+key);
  if(eEl){eEl.textContent=s.entry||"--";eEl.className="fx-cell-v "+(s.entry?"entry":"empty");}

  var tEl=document.getElementById("tp-"+key);
  if(tEl){tEl.textContent=s.tp||"--";tEl.className="fx-cell-v "+(s.tp?"tp":"empty");}

  var slEl=document.getElementById("sl-"+key);
  if(slEl){slEl.textContent=s.sl||"--";slEl.className="fx-cell-v "+(s.sl?"sl":"empty");}

  var otEl=document.getElementById("ot-"+key);
  if(otEl){otEl.textContent=s.openTime||"--";otEl.className="fx-cell-v "+(s.openTime?"time":"empty");}

  var aEl=document.getElementById("act-"+key);
  if(aEl){
    aEl.textContent=act==="BUY"?"BUY":act==="SELL"?"SELL":"WAITING";
    aEl.className="fx-action"+(act==="BUY"?" buy":act==="SELL"?" sell":"");
  }

  var rEl=document.getElementById("run-"+key);
  if(rEl){rEl.textContent=isA?"RUNNING":"";rEl.style.display=isA?"flex":"none";}

  // Old wide result bar — left permanently hidden now (replaced by the
  // compact closed-info block below, which sits in the RUNNING badge's
  // slot instead of growing the card).
  var resDiv=document.getElementById("res-"+key);
  if(resDiv)resDiv.className="fx-result";

  var ciEl=document.getElementById("closed-info-"+key);
  if(ciEl){
    ciEl.style.display=isC?"flex":"none";
    if(isC){
      var cpEl=document.getElementById("closed-price-"+key);
      if(cpEl){
        cpEl.textContent="CLOSED"+(s.closePrice?" @ "+s.closePrice:"");
        cpEl.className="fx-closed-price"+(s.closeResult==="TP"?" win":s.closeResult==="SL"?" loss":" manual");
      }
      var ctEl=document.getElementById("closed-time-"+key);
      if(ctEl)ctEl.textContent=s.closeTime||"";
    }
  }
  // Signal Type
  var stEl=document.getElementById("sigtype-"+key);
  if(stEl){
    stEl.textContent=s.signalType||"";
    if(s.signalType){stEl.style.setProperty("display","flex","important");}
  }

  // NEW SIGNAL badge — show for 5 min after open time
  var nbEl=document.getElementById("new-badge-"+key);
  if(nbEl){
    var showNew=false;
    if(s.openTime && isA){
      try{
        var op=s.openTime.replace(" UTC","").trim().split(" ");
        var dp=op[0].split("/");
        var tp3=op[1].split(":");
        var yr=new Date().getFullYear();
        var openMs=new Date(Date.UTC(yr,parseInt(dp[1])-1,parseInt(dp[0]),parseInt(tp3[0]),parseInt(tp3[1]))).getTime();
        var diffMin=(Date.now()-openMs)/60000;
        if(diffMin>=0&&diffMin<=5)showNew=true;
      }catch(e){}
    }
    nbEl.style.setProperty("display",showNew?"inline-block":"none","important");
  }
}

// Renames every id inside a cloned card (including the card's own id) from
// the "...-PAIR" pattern to "...-PAIR_ROW", so a cloned card never collides
// with the original template card's ids.
function fxRenameCloneIds(root, pair, newKey){
  var re = new RegExp("-"+pair+"$");
  if(root.id) root.id = root.id.replace(re, "-"+newKey);
  var all = root.querySelectorAll("[id]");
  for(var i=0;i<all.length;i++){
    all[i].id = all[i].id.replace(re, "-"+newKey);
  }
}

function fxRenderCards(){
  var noSig=document.getElementById("fx-no-signal");

  // Group live signals by pair, so multiple concurrent signals on the
  // same pair each get their own card instead of overwriting one another
  var groups={};
  for(var j=0;j<fxLive.length;j++){
    var p=fxLive[j].pair;
    if(!groups[p])groups[p]=[];
    groups[p].push(fxLive[j]);
  }

  // Remove only clones whose signal is no longer live (closed & cleared,
  // etc). Clones that are still live are left alone so their embedded
  // TradingView chart never gets reloaded/flickered on every refresh.
  var existingClones = document.querySelectorAll('.fx-card[data-fx-clone="1"]');
  for(var c=0;c<existingClones.length;c++){
    var cloneKey = existingClones[c].dataset.fxKey;
    var stillLive = fxLive.some(function(s){ return (s.pair+"_"+s.row)===cloneKey; });
    if(!stillLive){
      existingClones[c].parentNode.removeChild(existingClones[c]);
    }
  }

  var allCards=document.querySelectorAll(".fx-card");
  for(var i=0;i<allCards.length;i++){allCards[i].style.display="none";}

  if(!fxLive.length){
    if(noSig)noSig.style.display="block";
    return;
  }
  if(noSig)noSig.style.display="none";

  var activeN=0;
  for(var pairKey in groups){
    var sigs=groups[pairKey];
    var originalCard=document.getElementById("card-"+pairKey);
    if(!originalCard)continue;
    var insertAfter=originalCard;

    for(var s=0;s<sigs.length;s++){
      var sig=sigs[s];
      if(sig.status.toUpperCase()==="ACTIVE")activeN++;

      if(s===0){
        // First signal for this pair uses the pair's original template card
        fxUpdateCard(sig, pairKey);
        fxLoadRelated(pairKey);
        insertAfter=originalCard;
      } else {
        // Extra concurrent signal on the same pair — reuse its clone card
        // if one already exists (created on an earlier cycle) instead of
        // recreating it, so its embedded chart iframe stays untouched
        var key=pairKey+"_"+sig.row;
        var clone=document.getElementById("card-"+key);
        if(!clone){
          clone=originalCard.cloneNode(true);
          clone.dataset.fxClone="1";
          clone.dataset.fxKey=key;
          fxRenameCloneIds(clone, pairKey, key);
          insertAfter.parentNode.insertBefore(clone, insertAfter.nextSibling);
        }
        insertAfter=clone;
        fxUpdateCard(sig, key);
      }
    }
  }

  var ael=document.getElementById("fx-active");
  if(ael)ael.textContent=activeN;
}


function fxRenderHist(){
  var tb=document.getElementById("fx-hist");
  if(!tb)return;
  if(!fxHist.length){
    tb.innerHTML="<tr><td colspan='8' class='fx-empty'>No closed trades yet</td></tr>";
    var mw0=document.getElementById("fx-hist-more-wrap");
    if(mw0)mw0.style.display="none";
    return;
  }
  var rows=fxHist.slice(0,fxHistShown);
  var html="";
  for(var i=0;i<rows.length;i++){
    var h=rows[i];
    var w=h.result&&h.result.indexOf("TP")>-1;
    var dc=h.action==="BUY"?"buy":"sell";
    var isManual=h.result&&h.result.indexOf("MANUAL")>-1;var rc=w?"win":isManual?"manual":"loss";
    var pn=parseInt(h.pips)||0;
    html+="<tr><td class='muted'>"+h.closeDateTime+"</td><td class='pair'>"+h.pair+"</td><td class='"+dc+"'>"+h.action+"</td><td>"+h.entry+"</td><td>"+h.closePrice+"</td><td class='"+rc+"'>"+(pn>0?"+"+pn:pn)+"</td><td class='"+rc+"'>"+h.gainLoss+"</td><td class='"+rc+"'>"+(w?"TP HIT ✅":isManual?"MANUAL 🔵":"SL HIT ❌")+"</td></tr>";
  }
  tb.innerHTML=html;

  var mw=document.getElementById("fx-hist-more-wrap");
  var mb=document.getElementById("fx-hist-more-btn");
  if(mw&&mb){
    if(fxHistShown<fxHist.length){
      mw.style.display="block";
      mb.textContent="MORE ("+(fxHist.length-fxHistShown)+")";
    } else {
      mw.style.display="none";
    }
  }
}

function fxShowMoreHist(){
  fxHistShown += 10;
  fxRenderHist();
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
  var ctx=document.getElementById("fx-donut");if(!ctx)return;
  if(fxDonut)fxDonut.destroy();
  fxDonut=new Chart(ctx.getContext("2d"),{type:"doughnut",data:{labels:pairs,datasets:[{data:counts,backgroundColor:colors.map(function(c){return c+"bb"}),borderColor:colors.map(function(c){return c+"33"}),borderWidth:1,hoverOffset:4}]},options:{responsive:false,cutout:"65%",plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){return " "+c.label+": "+c.raw+" ("+Math.round(c.raw/total*100)+"%)"}},backgroundColor:"rgba(0,0,0,0.8)",bodyColor:"#aaa",borderColor:"rgba(255,255,255,0.1)",borderWidth:1}}}});
  var legEl=document.getElementById("fx-dleg");if(!legEl)return;
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

// Auto detect dark mode and update TV iframes
function fxUpdateTVTheme(){
  var isDark=document.body.classList.contains("drK")||!!document.querySelector(".drK");
  var theme=isDark?"dark":"light";
  var iframes=document.querySelectorAll("iframe[src*='tradingview-widget']");
  for(var i=0;i<iframes.length;i++){
    var src=iframes[i].src;
    if(isDark){src=src.replace("colorTheme%22%3A%22light","colorTheme%22%3A%22dark");}
    else{src=src.replace("colorTheme%22%3A%22dark","colorTheme%22%3A%22light");}
    if(iframes[i].src!==src)iframes[i].src=src;
  }
}

function fxSetTVTheme(){
  var isDark=document.body.classList.contains("drK")||!!document.querySelector(".drK");
  var iframes=document.querySelectorAll(".fxdb iframe");
  for(var i=0;i<iframes.length;i++){
    var src=iframes[i].src;
    if(!src)continue;
    if(isDark){
      src=src.replace("colorTheme%22%3A%22light","colorTheme%22%3A%22dark");
    } else {
      src=src.replace("colorTheme%22%3A%22dark","colorTheme%22%3A%22light");
    }
    if(iframes[i].src!==src)iframes[i].src=src;
  }
}

// Watch for dark mode class change
var fxDarkObs=new MutationObserver(function(){fxSetTVTheme();});
fxDarkObs.observe(document.body,{attributes:true,attributeFilter:["class"]});
var fxHtml=document.querySelector("html");
if(fxHtml)fxDarkObs.observe(fxHtml,{attributes:true,attributeFilter:["class"]});

fxTick();
setInterval(fxTick,1000);
fxFetchLive();
fxFetchHist();
fxFetchStats();
setInterval(fxFetchLive,15000);
setInterval(fxFetchHist,60000);
setInterval(fxFetchStats,60000);
setTimeout(fxSetTVTheme,1500);
setTimeout(fxUpdateTVTheme,2000);

/* =========================================================
   SUBSCRIBE BOX LOGIC (new addition) — reuses FX_URL above
   ========================================================= */

function fxSubscribe(){
  var input = document.getElementById("fx-sub-email");
  var btn   = document.getElementById("fx-sub-btn");
  var msg   = document.getElementById("fx-sub-msg");
  var email = input.value.trim();

  var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!re.test(email)){
    msg.className = "fx-sub-msg err";
    msg.textContent = "Please enter a valid email address.";
    return;
  }

  btn.disabled = true;
  btn.textContent = "...";
  msg.textContent = "";

  var cb = "_fxsub" + Date.now();
  var sc = document.createElement("script");
  var tm = setTimeout(function(){
    cleanup();
    showMsg("err","Something went wrong. Please try again.");
  }, 10000);

  function cleanup(){
    clearTimeout(tm);
    delete window[cb];
    if(sc.parentNode) sc.parentNode.removeChild(sc);
    btn.disabled = false;
    btn.textContent = "Subscribe";
  }

  function showMsg(type, text){
    msg.className = "fx-sub-msg " + type;
    msg.textContent = text;
  }

  window[cb] = function(d){
    cleanup();
    if(d.status === "ok"){
      showMsg("ok","Subscribed! You'll get an email on every new signal.");
      input.value = "";
    } else if(d.status === "duplicate"){
      showMsg("ok","You're already subscribed.");
    } else {
      showMsg("err","Please enter a valid email address.");
    }
  };

  sc.src = FX_URL + "?type=subscribe&email=" + encodeURIComponent(email) + "&callback=" + cb + "&t=" + Date.now();
  sc.onerror = function(){ cleanup(); showMsg("err","Something went wrong. Please try again."); };
  (document.head||document.body).appendChild(sc);
}

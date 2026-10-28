import Parser from 'rss-parser';
import { writeFileSync } from 'fs';

const parser = new Parser({ customFields: { item: [['media:thumbnail','mediaThumb'], ['media:content','mediaContent']] } });

const GNsearch = q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
const GNtopic  = t => `https://news.google.com/rss/headlines/section/topic/${t}?hl=en-US&gl=US&ceid=US:en`;
const YT       = id => `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;

const SOURCES = [
  // Local
  { category:'local',  kind:'article', limit:14, url: GNsearch('"Northern Kentucky" OR "Independence, Kentucky" OR "Kenton County" OR Cincinnati OR "Greater Cincinnati"') },
  // US (image-rich outlets + Google News for source diversity)
  { category:'us',     kind:'article', limit:8,  url: 'https://feeds.bbci.co.uk/news/world/us_and_canada/rss.xml' },
  { category:'us',     kind:'article', limit:8,  url: 'https://feeds.npr.org/1003/rss.xml' },
  { category:'us',     kind:'article', limit:8,  url: 'https://rss.nytimes.com/services/xml/rss/nyt/US.xml' },
  { category:'us',     kind:'article', limit:10, url: GNtopic('NATION') },
  // World
  { category:'world',  kind:'article', limit:8,  url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { category:'world',  kind:'article', limit:8,  url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
  { category:'world',  kind:'article', limit:8,  url: 'https://feeds.npr.org/1004/rss.xml' },
  { category:'world',  kind:'article', limit:10, url: GNtopic('WORLD') },
  // Tools / tech (image-rich)
  { category:'tech',   kind:'article', limit:8,  url: 'https://www.theverge.com/rss/index.xml' },
  { category:'tech',   kind:'article', limit:8,  url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
  { category:'tech',   kind:'article', limit:8,  url: 'https://techcrunch.com/feed/' },
];

function splitTitle(t){ const i=t.lastIndexOf(' - '); return i>20 ? {title:t.slice(0,i).trim(), src:t.slice(i+3).trim()} : {title:t.trim(), src:''}; }
function ytId(item){ if(item.id && item.id.includes(':')) return item.id.split(':').pop(); const m=(item.link||'').match(/[?&]v=([^&]+)/); return m?m[1]:''; }
function imageOf(item,kind){
  if(kind==='video'){ const id=ytId(item); return id?`https://i.ytimg.com/vi/${id}/hqdefault.jpg`:''; }
  const t=item.mediaThumb; if(t && t.$ && t.$.url) return t.$.url;
  const c=item.mediaContent; if(c && c.$ && c.$.url) return c.$.url;
  if(item.enclosure && item.enclosure.url) return item.enclosure.url;
  return '';
}
async function getText(url){
  const ac=new AbortController(); const timer=setTimeout(()=>ac.abort(), 12000);
  try{ const r=await fetch(url,{signal:ac.signal, headers:{'User-Agent':'Mozilla/5.0 ISI-news-aggregator'}}); if(!r.ok) throw new Error('HTTP '+r.status); return await r.text(); }
  finally{ clearTimeout(timer); }
}
async function one(s){
  const items=[];
  try{
    const xml=await getText(s.url);
    const feed=await parser.parseString(xml);
    const chan=feed.title||'';
    let n=0;
    for(const it of (feed.items||[])){
      if(n>=s.limit) break;
      let title=(it.title||'').trim(); if(!title) continue;
      let src='';
      if(s.kind==='video') src=chan;
      else if(s.url.includes('news.google.com')){ const sp=splitTitle(title); title=sp.title; src=sp.src; }
      else src=chan;
      const link=it.link||''; if(!link) continue;
      items.push({ title, link, source:src, category:s.category, kind:s.kind, date: it.isoDate || it.pubDate || '', image: imageOf(it,s.kind) });
      n++;
    }
    console.log('ok', s.category, '->', items.length);
  }catch(e){ console.error('FAIL', s.category, s.url.slice(0,45), e.message); }
  return items;
}

const results = await Promise.allSettled(SOURCES.map(one));
const out=[]; const seen=new Set();
for(const r of results){
  if(r.status!=='fulfilled') continue;
  for(const it of r.value){
    const key=it.title.toLowerCase().slice(0,60);
    if(seen.has(key)) continue; seen.add(key);
    out.push(it);
  }
}
out.sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
const feed = { updated:new Date().toISOString(), count:out.length, items: out.slice(0,120) };
writeFileSync('feed.json', JSON.stringify(feed));
console.log('wrote feed.json with', feed.items.length, 'items');

import Parser from 'rss-parser';
import { writeFileSync } from 'fs';

const parser = new Parser({
  timeout: 20000,
  headers: { 'User-Agent': 'Mozilla/5.0 IronSharpensIron-news-aggregator' },
  customFields: { item: [['media:thumbnail','mediaThumb'], ['media:content','mediaContent']] }
});

const GNsearch = q => `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
const GNtopic  = t => `https://news.google.com/rss/headlines/section/topic/${t}?hl=en-US&gl=US&ceid=US:en`;
const YT       = id => `https://www.youtube.com/feeds/videos.xml?channel_id=${id}`;

// Source-diverse, straight-news leaning. Google News aggregates many outlets per query.
const SOURCES = [
  { category:'local',  kind:'article', limit:14, url: GNsearch('Cincinnati OR "Greater Cincinnati"') },
  { category:'us',     kind:'article', limit:14, url: GNtopic('NATION') },
  { category:'world',  kind:'article', limit:14, url: GNtopic('WORLD') },
  { category:'tech',   kind:'article', limit:8,  url: 'https://www.theverge.com/rss/index.xml' },
  { category:'tech',   kind:'article', limit:8,  url: 'https://feeds.arstechnica.com/arstechnica/technology-lab' },
  { category:'tech',   kind:'article', limit:8,  url: GNtopic('TECHNOLOGY') },
  { category:'videos', kind:'video',   limit:6,  url: YT('UCAuUUnT6oDeKwE6v1NGQxug') }, // TED
  { category:'videos', kind:'video',   limit:6,  url: YT('UCsT0YIqwnpJCM-mx7-gSA4Q') }, // TEDx Talks
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

const out=[]; const seen=new Set();
for(const s of SOURCES){
  try{
    const feed = await parser.parseURL(s.url);
    const chan = feed.title || '';
    let n=0;
    for(const it of (feed.items||[])){
      if(n>=s.limit) break;
      let title=(it.title||'').trim(); if(!title) continue;
      let src='';
      if(s.kind==='video') src=chan;
      else if(s.url.includes('news.google.com')){ const sp=splitTitle(title); title=sp.title; src=sp.src; }
      else src=chan;
      const link=it.link||''; if(!link) continue;
      const key=title.toLowerCase().slice(0,60);
      if(seen.has(key)) continue; seen.add(key);
      out.push({ title, link, source:src, category:s.category, kind:s.kind, date: it.isoDate || it.pubDate || '', image: imageOf(it,s.kind) });
      n++;
    }
    console.log('ok', s.category, s.url.slice(0,50), '->', n);
  }catch(e){ console.error('FAIL', s.url, e.message); }
}
out.sort((a,b)=> new Date(b.date||0) - new Date(a.date||0));
const feed = { updated:new Date().toISOString(), count:out.length, items: out.slice(0,120) };
writeFileSync('feed.json', JSON.stringify(feed));
console.log('wrote feed.json with', feed.items.length, 'items');

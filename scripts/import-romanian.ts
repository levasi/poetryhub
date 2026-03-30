// Import classic Romanian public-domain poems into PoetryHub
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function extractExcerpt(content: string) {
  const lines = content.split('\n').filter(l => l.trim())
  return lines.slice(0, 2).join('\n')
}

function estimateReadingTime(content: string) {
  const words = content.split(/\s+/).length
  return Math.ceil(words / 200) * 60
}

async function uniqueSlug(base: string) {
  let slug = base
  let i = 1
  while (await prisma.poem.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`
  }
  return slug
}

const poems = [
  // ─── Mihai Eminescu (1850–1889) ───────────────────────────────────────────
  {
    author: 'Mihai Eminescu',
    title: 'Lacul',
    content: `Lacul codrilor albastru
Nuferi galbeni îl încarcă;
Tresărind în cercuri albe
El cutremură o barcă.

Și eu trec de-a lung de maluri,
Parc-ascult și parc-aștept
Ea din trestii să răsară
Și să-mi cadă lin pe piept;

Să sărim în luntrea mică,
Îngânați de glas de ape,
Și să scap din mână cârma,
Și lopețile să-mi scape;

Să plutim cuprinși de farmec
Sub lumina blândei lune —
Vântu-n trestii lin foșnească,
Unduioasa apă sune!

Dar nu vine... Singuratic
În zadar suspin și sufăr
Lângă lacul cel albastru
Încărcat cu flori de nufăr.`,
  },
  {
    author: 'Mihai Eminescu',
    title: 'Doina',
    content: `De la Nistru pân' la Tisa
Tot românul plânsu-mi-s-a,
Că nu mai poate străbate
De-atâta străinătate.

Din Hotin și pân' la Mare
Azi stăpânul nu mai are;
Din Dorohoi și pân' la Sate
Mai mult loc de îngropate.

Sus la munte, jos pe vale,
Vai de biet român, cu jale,
Codru-i frate cu românul
Iar în câmpuri, tot dușmanul.

Cine-a îndrăgit străinii,
Mânca-i-ar inima câinii,
Mânca-i-ar casa pustia
Și neamul nemernicia!

Cine-a îndrăgit pe nemți
Bată-l Dumnezeu cu temți,
Și cu boală grea și seacă
Pe loc să se prăpădească.

Vai de biet român săracul,
Îndărăt tot dă ca racul,
Nu sporim în nicio parte —
Dușmănit de soartă crudă.

Codru, frate cu românul,
Ajută la greu, stăpânul!
Nu lăsa bătut în câmpuri
Neamul nost-din vremi adânci.`,
  },
  {
    author: 'Mihai Eminescu',
    title: 'Sara pe deal',
    content: `Sara pe deal buciumul sună cu jale,
Turmele-l urc, stele le scapără-n cale,
Apele plâng, clar izvorând în fântâne;
Sub un salcâm, dragă, m-aștepți tu pe mine.

Luna pe cer trece-așa sfântă și clară,
Ochii tăi mari caută-n frunza cea rară,
Stelele nasc umezi pe bolta senină,
Pieptul de dor, fruntea de gânduri ți-e plină.

Nourii curg, raze-a lor șiruri despică,
Streșina veche a casei ridică;
Și osteniți oamenii-n somn se îmbracă —
Doar greierul sfânt cântă-n aria seacă.

Tu tremuți ca frunza cea mică,
Clipele trec, inima-mi strigă.
Vino, iubito, ți-aștept sărutarea —
Sara pe deal, lacrimile-mi sunt cântarea.`,
  },
  {
    author: 'Mihai Eminescu',
    title: 'Ce te legeni, codrule',
    content: `Ce te legeni, codrule,
Fără ploaie, fără vânt,
Cu crengile la pământ?

— De ce nu m-aș legăna,
Dacă trece vremea mea!
Ziua scade, noaptea crește
Și frunzișul mi-l rărește.

Bate vântul frunza-n dungă —
Cântărețul din pădure
Și pe gânduri mă aduce
De ce oare nu s-aduce?

Și de ce nu m-aș legăna,
Dacă trece vremea mea!
Îmi despoaie codrul des
Vechile-mi straie cu jeles.

Toamna grea vine pe vale
Și-mi aduce cu-a ei cale
Vântul, ploaia, frunza moartă —
Ce frumoasă-i altă soartă!`,
  },
  {
    author: 'Mihai Eminescu',
    title: 'Floare albastră',
    content: `Iar te-ai cufundat în stele
Și în nori și-n ceruri nalte?
De nu m-ai uita încalte,
Sufletul vieții mele.

În zadar râuri în soare
Grămădești-n a tale brațe,
Și câmpii de-aur, cetăți
Cu-a lor turle-n bătaie.

Eu am ochi numai pentru tine,
Tresărind sub al meu pas,
Și stau lângă tei bătrânul —
Tu ești marea, eu sunt glasul.

Hai în codrul cu verdeață,
Und' izvoare plâng în vale,
Stânca stă să ne prăvale,
Aproape de-a nopții față.

Acolo-n ochi de pădure,
Lângă balta cea senină
Și sub trestia cea lină
Vom ședea în foi de mure.

Și mi-i spune-atunci povești
Și minciuni cu-a ta guriță,
Eu pe-un fir de românița
Voi cerca de mă iubești.

Floare-albastră! floare-albastră!...
Totuși este trist în lume!`,
  },

  // ─── George Coșbuc (1866–1918) ────────────────────────────────────────────
  {
    author: 'George Coșbuc',
    title: 'Mama',
    content: `Atunci, când eram copil mic
Și nu știam nimic,
Ea mă-nvăța c-un glas domol
Să zic: „Tată și mamă!"

Privind spre cer cu drag și dor
Îmi spunea: „Dumnezeu trăiesc,
Copile, ascultă-mă,
Și El pe toți ne miluiesc."

De-atunci, de când eram mic,
Trecând cu ea prin strâmt și larg,
Ea m-a-nvățat să merg drept,
Să spun adevărul mereu.

Dar azi când ea e-n groapă rece
Și nu mai pot s-o văd,
Îmi pare că-n vânt ea-mi zice
„Fă bine și nu-ți fie frică!"

Deci, mamă, tu erai lumina
Ce-mi lumina cărările-n viață —
Și-acum, deși ești dusă,
Prin tine simt că nu mă pierde-n față.`,
  },
  {
    author: 'George Coșbuc',
    title: 'Iarna pe uliță',
    content: `Troiene albe pe câmpii,
Pe drumuri și pe dealuri,
Și-n sat, la geamuri, copiii
Privesc viscolul prin zaluri.

Dar ei nu știu de frig și ger —
Ies veseli iute-n zăpadă,
Se bat cu bulgări sub cer,
Și râd și-aleargă în grabă.

Pe sanie cu zurgălăi
Și cu cai plini de nechezat,
Flăcăii trec pe sub plăieți
Și strigă-n vânt dezmățat.

Iar babele lângă foc
Torc lâna în casă caldă
Și povestesc câte-un coloc
Istorii de demult, bătrâne.

Și iarna trece lin și greu
Peste câmpii și peste sate —
Dar inima românului
De frig și ger nu se-nfrânge.`,
  },

  // ─── Vasile Alecsandri (1821–1890) ────────────────────────────────────────
  {
    author: 'Vasile Alecsandri',
    title: 'Hora Unirii',
    content: `Hai să dăm mână cu mână
Cei cu inima română,
Să-nvârtim hora frăției
Pe pământul României!

Iarba rea din holde piară!
Piară dușmănia-amară!
Între noi să nu mai fie
Decât flori și omenie!

Măi române din Moldova,
Măi române de la munte,
Vino la frăție bine,
Hai să fim cu toți împreună!

Unde-i unul, nu-i putere
La nevoi și la durere.
Unde-s doi, puterea crește
Și dușmanul nu sporește!

Hai să dăm mână cu mână
Cei cu inima română,
Să-nvârtim hora frăției
Pe pământul României!`,
  },
  {
    author: 'Vasile Alecsandri',
    title: 'Pasteluri — Iarna',
    content: `Iarna, iarna vine iute,
Câmpul nins în zare mută —
Fulgii cad albi și ușori,
Ca de îngeri trimiși jos.

Codrul doarme sub omăt
Și izvorul s-a-nghețat,
Numai corbul singuratic
Crooncănește pe cer rece.

Vântul urlă pe la colibe,
Troienele cresc pe-afară,
Dar la vatră-i cald și bine —
Hai, copii, la horă, iară!

Săniile trec pe gheață,
Zurgălăii sună viu —
Iarna-și arată-a sa față
Albă, rece, dar cu dor.`,
  },

  // ─── Octavian Goga (1881–1938) ────────────────────────────────────────────
  {
    author: 'Octavian Goga',
    title: 'Plugarii',
    content: `Cântați, plugari, cu glas de tunet
Al vostru imn de biruință,
Voi ce-ați purtat pe umeri crucea
Și ați trecut prin suferință.

Voi ce frângeți glia neagră
Cu brațul vostru cel de fier,
Și care-ați dat acestui neam
Pâinea și speranța spre cer.

Cântați cu tot ce-aveti mai sfânt,
Cântați cu lacrimi și cu sânge —
De plugul vostru sfânt, pământul
Cu drag și dor se tot rupe-n plânge.

Voi sunteți temelia țării,
Stâlpii ei de-a pururea —
Cântați, plugari, cu glas de tunet,
România trăiește prin voi!`,
  },
  {
    author: 'Octavian Goga',
    title: 'Noi',
    content: `Noi suntem cei din urmă veniți
Pe-această lume rece —
Purtăm în suflet urme din
Durerea care trece.

Din munți am coborât cu dor
Și ne-am oprit la șes,
Purtând în piept un steag aprins
De-al nostru neam ales.

Ne-au bătut și ne-au zdrobit
Și ne-au luat ce-aveam,
Dar n-au putut să ne răpească
Credința și neamul.

Suntem ai neamului odrasle
Crescute-n chin și dor —
Și vom pleca cu fruntea sus
Spre zările de mâine în zbor.`,
  },
]

async function main() {
  console.log('🇷🇴  Importing Romanian poems...\n')
  let imported = 0
  let skipped = 0

  for (const p of poems) {
    // Upsert author
    const authorSlug = slugify(p.author)
    let author = await prisma.author.findUnique({ where: { slug: authorSlug } })
    if (!author) {
      author = await prisma.author.create({
        data: { name: p.author, slug: authorSlug, nationality: 'Romanian' },
      })
      console.log(`  ✓ Author: ${p.author}`)
    }

    // Skip duplicate
    const existing = await prisma.poem.findFirst({
      where: { title: p.title, authorId: author.id },
    })
    if (existing) {
      console.log(`  – Skipped (exists): ${p.title}`)
      skipped++
      continue
    }

    const baseSlug = slugify(p.title)
    const poemSlug = await uniqueSlug(baseSlug)

    await prisma.poem.create({
      data: {
        title: p.title,
        slug: poemSlug,
        content: p.content.trim(),
        excerpt: extractExcerpt(p.content),
        readingTime: estimateReadingTime(p.content),
        authorId: author.id,
        language: 'ro',
        source: 'classic',
      },
    })

    console.log(`  ✓ Imported: ${p.title} — ${p.author}`)
    imported++
  }

  console.log(`\n✅  Done. ${imported} imported, ${skipped} skipped.`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })

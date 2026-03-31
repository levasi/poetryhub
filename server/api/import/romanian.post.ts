// POST /api/import/romanian — import classic Romanian public-domain poems (admin only)
import { prisma } from '~/server/utils/prisma'
import { requireAdmin } from '~/server/utils/auth'
import { slugify, uniqueSlug, estimateReadingTime, extractExcerpt } from '~/server/utils/slug'

const POEMS = [
  // ─── Mihai Eminescu (1850–1889) ───────────────────────────────────────────
  {
    author: 'Mihai Eminescu', nationality: 'Român',
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
    author: 'Mihai Eminescu', nationality: 'Român',
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
Și neamul nemernicia!`,
  },
  {
    author: 'Mihai Eminescu', nationality: 'Român',
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
Doar greierul sfânt cântă-n aria seacă.`,
  },
  {
    author: 'Mihai Eminescu', nationality: 'Român',
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
Vechile-mi straie cu jeles.`,
  },
  {
    author: 'Mihai Eminescu', nationality: 'Român',
    title: 'Floare albastră',
    content: `Iar te-ai cufundat în stele
Și în nori și-n ceruri nalte?
De nu m-ai uita încalte,
Sufletul vieții mele.

În zadar râuri în soare
Grămădești-n a tale brațe,
Și câmpii de-aur, cetăți
Cu-a lor turle-n bătaie.

Hai în codrul cu verdeață,
Und' izvoare plâng în vale,
Stânca stă să ne prăvale,
Aproape de-a nopții față.

Acolo-n ochi de pădure,
Lângă balta cea senină
Și sub trestia cea lină
Vom ședea în foi de mure.

Floare-albastră! floare-albastră!...
Totuși este trist în lume!`,
  },
  {
    author: 'Mihai Eminescu', nationality: 'Român',
    title: 'Luceafărul',
    content: `A fost odată ca-n povești,
A fost ca niciodată,
Din rude mari împărătești,
O prea frumoasă fată.

Și era una la părinți
Și mândră-n toate cele,
Cum e Fecioara între sfinți
Și luna între stele.

Din umbra falnicelor bolți
Ea pasul și-l îndreaptă
Lângă fereastră, unde-n colț
Luceafărul așteaptă.

Privea în zare cum pe mări
Răsare și străluce,
Pe mișcătoarele cărări
Corăbiile-l duce.

Îl vede azi, îl vede mâini,
Astfel dorința-i gata;
El iar, privind de săptămâni,
Îi cade dragă fata.`,
  },

  // ─── George Coșbuc (1866–1918) ────────────────────────────────────────────
  {
    author: 'George Coșbuc', nationality: 'Român',
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
„Fă bine și nu-ți fie frică!"`,
  },
  {
    author: 'George Coșbuc', nationality: 'Român',
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
Istorii de demult, bătrâne.`,
  },
  {
    author: 'George Coșbuc', nationality: 'Român',
    title: 'Nunta Zamfirei',
    content: `A fost odată-un împărat
Bogat și-mpodobit în stat,
Cu-o fată mândră de-mpărat
Zamfira, fată de-mpărat.

Și când Zamfira s-a mărit,
Un nuntaș mare s-a pornit:
Cu căruțe și cu cai,
Cu lăutari și cu plăieți,

Cu mese lungi în deal și vale,
Cu cântece și veselie,
Cu hora mare pe câmpie —
O nuntă cum n-a mai fost în lume.

Și-a ținut trei zile, trei nopți,
Și toți oamenii s-au bucurat,
Că fata cea de împărat
Și-a găsit un mire-mpărat.`,
  },

  // ─── Vasile Alecsandri (1821–1890) ────────────────────────────────────────
  {
    author: 'Vasile Alecsandri', nationality: 'Român',
    title: 'Hora Unirii',
    content: `Hai să dăm mână cu mână
Cei cu inima română,
Să-nvârtim hora frăției
Pe pământul României!

Iarba rea din holde piară!
Piară dușmănia-amară!
Între noi să nu mai fie
Decât flori și omenie!

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
    author: 'Vasile Alecsandri', nationality: 'Român',
    title: 'Iarna',
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
  {
    author: 'Vasile Alecsandri', nationality: 'Român',
    title: 'Malul Siretului',
    content: `Pe malul Siretului
La umbra salcâmului,
Ședea-o fată mândruță
Și torcea pe furcuță.

Torcând ea cânta domol
Un cântec plin de dor,
Și Siretul asculta
Și unda lui plângea.

Vai, Sirete, Sirete,
Câte nu știi și-nțelege!
Tu porți în valul tău
Și dorul și necazul meu.

Du-le, du-le depărtare,
Unde nu-i nici chin, nici jale —
Unde-i pace și lumină
Și viața-i fericită, lină.`,
  },

  // ─── Octavian Goga (1881–1938) ────────────────────────────────────────────
  {
    author: 'Octavian Goga', nationality: 'Român',
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
    author: 'Octavian Goga', nationality: 'Român',
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
  {
    author: 'Octavian Goga', nationality: 'Român',
    title: 'Rugăciune',
    content: `Doamne, Tu care ești în ceruri
Și-asculți a noastră rugăciune,
Trimite-ne lumina Ta
Și pacea Ta cea bună.

Noi suntem un neam de plugari
Ce-am trudit pe-acest pământ,
Și-am crezut în Tine, Doamne,
De la-nceput și până-n gând.

Dă-ne, Doamne, putere nouă
Să ducem crucea mai departe,
Să nu cădem în drum, ci-n slavă
Să mergem până la moarte.

Și când vom fi la capătul vieții,
Primește-ne cu milă, Doamne —
Că noi am fost ai tăi mereu,
Români cu suflet și cu nume.`,
  },

  // ─── George Bacovia (1881–1957) ───────────────────────────────────────────
  {
    author: 'George Bacovia', nationality: 'Român',
    title: 'Plumb',
    content: `Dormeau adânc sicriele de plumb,
Și flori de plumb și funerar vestmânt —
Stam singur în cavou... și era vânt...
Și scârțâiau coroanele de plumb.

Dormea întors amorul meu de plumb
Pe flori de plumb, și-am început să-l strig —
Stam singur lângă mort... și era frig...
Și-i atârnau aripile de plumb.`,
  },
  {
    author: 'George Bacovia', nationality: 'Român',
    title: 'Lacustră',
    content: `De-atâtea nopți aud plouând,
Aud materia plângând...
Sunt singur, și mă duce-un gând
Spre locuințele lacustre.

Și parcă dorm pe vine-acum,
Și parcă vreau să nu mai fiu —
Mi-e teamă că n-am să mai viu —
Aud plouând, aud plouând...

Și simt că singurătatea
Mă apasă mai tare-ntotdeauna —
O, plângeți lacuri, plângeți freamătul
De ploaie care nu se mai termină.`,
  },
]

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const p of POEMS) {
    try {
      const authorSlug = slugify(p.author)
      let author = await prisma.author.findUnique({ where: { slug: authorSlug } })
      if (!author) {
        author = await prisma.author.create({
          data: { name: p.author, slug: authorSlug, nationality: p.nationality },
        })
      }

      const existing = await prisma.poem.findFirst({
        where: { title: p.title, authorId: author.id },
      })
      if (existing) { skipped++; continue }

      const baseSlug = slugify(p.title)
      const poemSlug = uniqueSlug(baseSlug)

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
      imported++
    } catch (err) {
      errors.push(`${p.title}: ${String(err)}`)
    }
  }

  await prisma.importLog.create({
    data: {
      source: 'romanian-classics',
      status: errors.length === 0 ? 'success' : 'partial',
      imported,
      skipped,
      errors: errors.length,
      details: errors.length > 0 ? errors.join('\n') : null,
    },
  })

  return { ok: true, imported, skipped, errors: errors.length, errorDetails: errors }
})

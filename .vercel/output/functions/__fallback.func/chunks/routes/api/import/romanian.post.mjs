import { d as defineEventHandler, e as requireAdmin, j as slugify, p as prisma, u as uniqueSlug, k as estimateReadingTime, l as extractExcerpt } from '../../../nitro/nitro.mjs';
import 'jose';
import '@prisma/client';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue-router';

const POEMS = [
  // ─── Mihai Eminescu (1850–1889) ───────────────────────────────────────────
  {
    author: "Mihai Eminescu",
    nationality: "Rom\xE2n\u0103",
    title: "Lacul",
    content: `Lacul codrilor albastru
Nuferi galbeni \xEEl \xEEncarc\u0103;
Tres\u0103rind \xEEn cercuri albe
El cutremur\u0103 o barc\u0103.

\u0218i eu trec de-a lung de maluri,
Parc-ascult \u0219i parc-a\u0219tept
Ea din trestii s\u0103 r\u0103sar\u0103
\u0218i s\u0103-mi cad\u0103 lin pe piept;

S\u0103 s\u0103rim \xEEn luntrea mic\u0103,
\xCEng\xE2na\u021Bi de glas de ape,
\u0218i s\u0103 scap din m\xE2n\u0103 c\xE2rma,
\u0218i lope\u021Bile s\u0103-mi scape;

S\u0103 plutim cuprin\u0219i de farmec
Sub lumina bl\xE2ndei lune \u2014
V\xE2ntu-n trestii lin fo\u0219neasc\u0103,
Unduioasa ap\u0103 sune!

Dar nu vine... Singuratic
\xCEn zadar suspin \u0219i suf\u0103r
L\xE2ng\u0103 lacul cel albastru
\xCEnc\u0103rcat cu flori de nuf\u0103r.`
  },
  {
    author: "Mihai Eminescu",
    nationality: "Rom\xE2n\u0103",
    title: "Doina",
    content: `De la Nistru p\xE2n' la Tisa
Tot rom\xE2nul pl\xE2nsu-mi-s-a,
C\u0103 nu mai poate str\u0103bate
De-at\xE2ta str\u0103in\u0103tate.

Din Hotin \u0219i p\xE2n' la Mare
Azi st\u0103p\xE2nul nu mai are;
Din Dorohoi \u0219i p\xE2n' la Sate
Mai mult loc de \xEEngropate.

Sus la munte, jos pe vale,
Vai de biet rom\xE2n, cu jale,
Codru-i frate cu rom\xE2nul
Iar \xEEn c\xE2mpuri, tot du\u0219manul.

Cine-a \xEEndr\u0103git str\u0103inii,
M\xE2nca-i-ar inima c\xE2inii,
M\xE2nca-i-ar casa pustia
\u0218i neamul nemernicia!`
  },
  {
    author: "Mihai Eminescu",
    nationality: "Rom\xE2n\u0103",
    title: "Sara pe deal",
    content: `Sara pe deal buciumul sun\u0103 cu jale,
Turmele-l urc, stele le scap\u0103r\u0103-n cale,
Apele pl\xE2ng, clar izvor\xE2nd \xEEn f\xE2nt\xE2ne;
Sub un salc\xE2m, drag\u0103, m-a\u0219tep\u021Bi tu pe mine.

Luna pe cer trece-a\u0219a sf\xE2nt\u0103 \u0219i clar\u0103,
Ochii t\u0103i mari caut\u0103-n frunza cea rar\u0103,
Stelele nasc umezi pe bolta senin\u0103,
Pieptul de dor, fruntea de g\xE2nduri \u021Bi-e plin\u0103.

Nourii curg, raze-a lor \u0219iruri despic\u0103,
Stre\u0219ina veche a casei ridic\u0103;
\u0218i osteni\u021Bi oamenii-n somn se \xEEmbrac\u0103 \u2014
Doar greierul sf\xE2nt c\xE2nt\u0103-n aria seac\u0103.`
  },
  {
    author: "Mihai Eminescu",
    nationality: "Rom\xE2n\u0103",
    title: "Ce te legeni, codrule",
    content: `Ce te legeni, codrule,
F\u0103r\u0103 ploaie, f\u0103r\u0103 v\xE2nt,
Cu crengile la p\u0103m\xE2nt?

\u2014 De ce nu m-a\u0219 leg\u0103na,
Dac\u0103 trece vremea mea!
Ziua scade, noaptea cre\u0219te
\u0218i frunzi\u0219ul mi-l r\u0103re\u0219te.

Bate v\xE2ntul frunza-n dung\u0103 \u2014
C\xE2nt\u0103re\u021Bul din p\u0103dure
\u0218i pe g\xE2nduri m\u0103 aduce
De ce oare nu s-aduce?

\u0218i de ce nu m-a\u0219 leg\u0103na,
Dac\u0103 trece vremea mea!
\xCEmi despoaie codrul des
Vechile-mi straie cu jeles.`
  },
  {
    author: "Mihai Eminescu",
    nationality: "Rom\xE2n\u0103",
    title: "Floare albastr\u0103",
    content: `Iar te-ai cufundat \xEEn stele
\u0218i \xEEn nori \u0219i-n ceruri nalte?
De nu m-ai uita \xEEncalte,
Sufletul vie\u021Bii mele.

\xCEn zadar r\xE2uri \xEEn soare
Gr\u0103m\u0103de\u0219ti-n a tale bra\u021Be,
\u0218i c\xE2mpii de-aur, cet\u0103\u021Bi
Cu-a lor turle-n b\u0103taie.

Hai \xEEn codrul cu verdea\u021B\u0103,
Und' izvoare pl\xE2ng \xEEn vale,
St\xE2nca st\u0103 s\u0103 ne pr\u0103vale,
Aproape de-a nop\u021Bii fa\u021B\u0103.

Acolo-n ochi de p\u0103dure,
L\xE2ng\u0103 balta cea senin\u0103
\u0218i sub trestia cea lin\u0103
Vom \u0219edea \xEEn foi de mure.

Floare-albastr\u0103! floare-albastr\u0103!...
Totu\u0219i este trist \xEEn lume!`
  },
  {
    author: "Mihai Eminescu",
    nationality: "Rom\xE2n\u0103",
    title: "Luceaf\u0103rul",
    content: `A fost odat\u0103 ca-n pove\u0219ti,
A fost ca niciodat\u0103,
Din rude mari \xEEmp\u0103r\u0103te\u0219ti,
O prea frumoas\u0103 fat\u0103.

\u0218i era una la p\u0103rin\u021Bi
\u0218i m\xE2ndr\u0103-n toate cele,
Cum e Fecioara \xEEntre sfin\u021Bi
\u0218i luna \xEEntre stele.

Din umbra falnicelor bol\u021Bi
Ea pasul \u0219i-l \xEEndreapt\u0103
L\xE2ng\u0103 fereastr\u0103, unde-n col\u021B
Luceaf\u0103rul a\u0219teapt\u0103.

Privea \xEEn zare cum pe m\u0103ri
R\u0103sare \u0219i str\u0103luce,
Pe mi\u0219c\u0103toarele c\u0103r\u0103ri
Cor\u0103biile-l duce.

\xCEl vede azi, \xEEl vede m\xE2ini,
Astfel dorin\u021Ba-i gata;
El iar, privind de s\u0103pt\u0103m\xE2ni,
\xCEi cade drag\u0103 fata.`
  },
  // ─── George Coșbuc (1866–1918) ────────────────────────────────────────────
  {
    author: "George Co\u0219buc",
    nationality: "Rom\xE2n\u0103",
    title: "Mama",
    content: `Atunci, c\xE2nd eram copil mic
\u0218i nu \u0219tiam nimic,
Ea m\u0103-nv\u0103\u021Ba c-un glas domol
S\u0103 zic: \u201ETat\u0103 \u0219i mam\u0103!"

Privind spre cer cu drag \u0219i dor
\xCEmi spunea: \u201EDumnezeu tr\u0103iesc,
Copile, ascult\u0103-m\u0103,
\u0218i El pe to\u021Bi ne miluiesc."

De-atunci, de c\xE2nd eram mic,
Trec\xE2nd cu ea prin str\xE2mt \u0219i larg,
Ea m-a-nv\u0103\u021Bat s\u0103 merg drept,
S\u0103 spun adev\u0103rul mereu.

Dar azi c\xE2nd ea e-n groap\u0103 rece
\u0218i nu mai pot s-o v\u0103d,
\xCEmi pare c\u0103-n v\xE2nt ea-mi zice
\u201EF\u0103 bine \u0219i nu-\u021Bi fie fric\u0103!"`
  },
  {
    author: "George Co\u0219buc",
    nationality: "Rom\xE2n\u0103",
    title: "Iarna pe uli\u021B\u0103",
    content: `Troiene albe pe c\xE2mpii,
Pe drumuri \u0219i pe dealuri,
\u0218i-n sat, la geamuri, copiii
Privesc viscolul prin zaluri.

Dar ei nu \u0219tiu de frig \u0219i ger \u2014
Ies veseli iute-n z\u0103pad\u0103,
Se bat cu bulg\u0103ri sub cer,
\u0218i r\xE2d \u0219i-alearg\u0103 \xEEn grab\u0103.

Pe sanie cu zurg\u0103l\u0103i
\u0218i cu cai plini de nechezat,
Fl\u0103c\u0103ii trec pe sub pl\u0103ie\u021Bi
\u0218i strig\u0103-n v\xE2nt dezm\u0103\u021Bat.

Iar babele l\xE2ng\u0103 foc
Torc l\xE2na \xEEn cas\u0103 cald\u0103
\u0218i povestesc c\xE2te-un coloc
Istorii de demult, b\u0103tr\xE2ne.`
  },
  {
    author: "George Co\u0219buc",
    nationality: "Rom\xE2n\u0103",
    title: "Nunta Zamfirei",
    content: `A fost odat\u0103-un \xEEmp\u0103rat
Bogat \u0219i-mpodobit \xEEn stat,
Cu-o fat\u0103 m\xE2ndr\u0103 de-mp\u0103rat
Zamfira, fat\u0103 de-mp\u0103rat.

\u0218i c\xE2nd Zamfira s-a m\u0103rit,
Un nunta\u0219 mare s-a pornit:
Cu c\u0103ru\u021Be \u0219i cu cai,
Cu l\u0103utari \u0219i cu pl\u0103ie\u021Bi,

Cu mese lungi \xEEn deal \u0219i vale,
Cu c\xE2ntece \u0219i veselie,
Cu hora mare pe c\xE2mpie \u2014
O nunt\u0103 cum n-a mai fost \xEEn lume.

\u0218i-a \u021Binut trei zile, trei nop\u021Bi,
\u0218i to\u021Bi oamenii s-au bucurat,
C\u0103 fata cea de \xEEmp\u0103rat
\u0218i-a g\u0103sit un mire-mp\u0103rat.`
  },
  // ─── Vasile Alecsandri (1821–1890) ────────────────────────────────────────
  {
    author: "Vasile Alecsandri",
    nationality: "Rom\xE2n\u0103",
    title: "Hora Unirii",
    content: `Hai s\u0103 d\u0103m m\xE2n\u0103 cu m\xE2n\u0103
Cei cu inima rom\xE2n\u0103,
S\u0103-nv\xE2rtim hora fr\u0103\u021Biei
Pe p\u0103m\xE2ntul Rom\xE2niei!

Iarba rea din holde piar\u0103!
Piar\u0103 du\u0219m\u0103nia-amar\u0103!
\xCEntre noi s\u0103 nu mai fie
Dec\xE2t flori \u0219i omenie!

Unde-i unul, nu-i putere
La nevoi \u0219i la durere.
Unde-s doi, puterea cre\u0219te
\u0218i du\u0219manul nu spore\u0219te!

Hai s\u0103 d\u0103m m\xE2n\u0103 cu m\xE2n\u0103
Cei cu inima rom\xE2n\u0103,
S\u0103-nv\xE2rtim hora fr\u0103\u021Biei
Pe p\u0103m\xE2ntul Rom\xE2niei!`
  },
  {
    author: "Vasile Alecsandri",
    nationality: "Rom\xE2n\u0103",
    title: "Iarna",
    content: `Iarna, iarna vine iute,
C\xE2mpul nins \xEEn zare mut\u0103 \u2014
Fulgii cad albi \u0219i u\u0219ori,
Ca de \xEEngeri trimi\u0219i jos.

Codrul doarme sub om\u0103t
\u0218i izvorul s-a-nghe\u021Bat,
Numai corbul singuratic
Croonc\u0103ne\u0219te pe cer rece.

V\xE2ntul url\u0103 pe la colibe,
Troienele cresc pe-afar\u0103,
Dar la vatr\u0103-i cald \u0219i bine \u2014
Hai, copii, la hor\u0103, iar\u0103!

S\u0103niile trec pe ghea\u021B\u0103,
Zurg\u0103l\u0103ii sun\u0103 viu \u2014
Iarna-\u0219i arat\u0103-a sa fa\u021B\u0103
Alb\u0103, rece, dar cu dor.`
  },
  {
    author: "Vasile Alecsandri",
    nationality: "Rom\xE2n\u0103",
    title: "Malul Siretului",
    content: `Pe malul Siretului
La umbra salc\xE2mului,
\u0218edea-o fat\u0103 m\xE2ndru\u021B\u0103
\u0218i torcea pe furcu\u021B\u0103.

Torc\xE2nd ea c\xE2nta domol
Un c\xE2ntec plin de dor,
\u0218i Siretul asculta
\u0218i unda lui pl\xE2ngea.

Vai, Sirete, Sirete,
C\xE2te nu \u0219tii \u0219i-n\u021Belege!
Tu por\u021Bi \xEEn valul t\u0103u
\u0218i dorul \u0219i necazul meu.

Du-le, du-le dep\u0103rtare,
Unde nu-i nici chin, nici jale \u2014
Unde-i pace \u0219i lumin\u0103
\u0218i via\u021Ba-i fericit\u0103, lin\u0103.`
  },
  // ─── Octavian Goga (1881–1938) ────────────────────────────────────────────
  {
    author: "Octavian Goga",
    nationality: "Rom\xE2n\u0103",
    title: "Plugarii",
    content: `C\xE2nta\u021Bi, plugari, cu glas de tunet
Al vostru imn de biruin\u021B\u0103,
Voi ce-a\u021Bi purtat pe umeri crucea
\u0218i a\u021Bi trecut prin suferin\u021B\u0103.

Voi ce fr\xE2nge\u021Bi glia neagr\u0103
Cu bra\u021Bul vostru cel de fier,
\u0218i care-a\u021Bi dat acestui neam
P\xE2inea \u0219i speran\u021Ba spre cer.

C\xE2nta\u021Bi cu tot ce-aveti mai sf\xE2nt,
C\xE2nta\u021Bi cu lacrimi \u0219i cu s\xE2nge \u2014
De plugul vostru sf\xE2nt, p\u0103m\xE2ntul
Cu drag \u0219i dor se tot rupe-n pl\xE2nge.

Voi sunte\u021Bi temelia \u021B\u0103rii,
St\xE2lpii ei de-a pururea \u2014
C\xE2nta\u021Bi, plugari, cu glas de tunet,
Rom\xE2nia tr\u0103ie\u0219te prin voi!`
  },
  {
    author: "Octavian Goga",
    nationality: "Rom\xE2n\u0103",
    title: "Noi",
    content: `Noi suntem cei din urm\u0103 veni\u021Bi
Pe-aceast\u0103 lume rece \u2014
Purt\u0103m \xEEn suflet urme din
Durerea care trece.

Din mun\u021Bi am cobor\xE2t cu dor
\u0218i ne-am oprit la \u0219es,
Purt\xE2nd \xEEn piept un steag aprins
De-al nostru neam ales.

Ne-au b\u0103tut \u0219i ne-au zdrobit
\u0218i ne-au luat ce-aveam,
Dar n-au putut s\u0103 ne r\u0103peasc\u0103
Credin\u021Ba \u0219i neamul.

Suntem ai neamului odrasle
Crescute-n chin \u0219i dor \u2014
\u0218i vom pleca cu fruntea sus
Spre z\u0103rile de m\xE2ine \xEEn zbor.`
  },
  {
    author: "Octavian Goga",
    nationality: "Rom\xE2n\u0103",
    title: "Rug\u0103ciune",
    content: `Doamne, Tu care e\u0219ti \xEEn ceruri
\u0218i-ascul\u021Bi a noastr\u0103 rug\u0103ciune,
Trimite-ne lumina Ta
\u0218i pacea Ta cea bun\u0103.

Noi suntem un neam de plugari
Ce-am trudit pe-acest p\u0103m\xE2nt,
\u0218i-am crezut \xEEn Tine, Doamne,
De la-nceput \u0219i p\xE2n\u0103-n g\xE2nd.

D\u0103-ne, Doamne, putere nou\u0103
S\u0103 ducem crucea mai departe,
S\u0103 nu c\u0103dem \xEEn drum, ci-n slav\u0103
S\u0103 mergem p\xE2n\u0103 la moarte.

\u0218i c\xE2nd vom fi la cap\u0103tul vie\u021Bii,
Prime\u0219te-ne cu mil\u0103, Doamne \u2014
C\u0103 noi am fost ai t\u0103i mereu,
Rom\xE2ni cu suflet \u0219i cu nume.`
  },
  // ─── George Bacovia (1881–1957) ───────────────────────────────────────────
  {
    author: "George Bacovia",
    nationality: "Rom\xE2n\u0103",
    title: "Plumb",
    content: `Dormeau ad\xE2nc sicriele de plumb,
\u0218i flori de plumb \u0219i funerar vestm\xE2nt \u2014
Stam singur \xEEn cavou... \u0219i era v\xE2nt...
\u0218i sc\xE2r\u021B\xE2iau coroanele de plumb.

Dormea \xEEntors amorul meu de plumb
Pe flori de plumb, \u0219i-am \xEEnceput s\u0103-l strig \u2014
Stam singur l\xE2ng\u0103 mort... \u0219i era frig...
\u0218i-i at\xE2rnau aripile de plumb.`
  },
  {
    author: "George Bacovia",
    nationality: "Rom\xE2n\u0103",
    title: "Lacustr\u0103",
    content: `De-at\xE2tea nop\u021Bi aud plou\xE2nd,
Aud materia pl\xE2ng\xE2nd...
Sunt singur, \u0219i m\u0103 duce-un g\xE2nd
Spre locuin\u021Bele lacustre.

\u0218i parc\u0103 dorm pe vine-acum,
\u0218i parc\u0103 vreau s\u0103 nu mai fiu \u2014
Mi-e team\u0103 c\u0103 n-am s\u0103 mai viu \u2014
Aud plou\xE2nd, aud plou\xE2nd...

\u0218i simt c\u0103 singur\u0103tatea
M\u0103 apas\u0103 mai tare-ntotdeauna \u2014
O, pl\xE2nge\u021Bi lacuri, pl\xE2nge\u021Bi fream\u0103tul
De ploaie care nu se mai termin\u0103.`
  }
];
const romanian_post = defineEventHandler(async (event) => {
  await requireAdmin(event);
  let imported = 0;
  let skipped = 0;
  const errors = [];
  for (const p of POEMS) {
    try {
      const authorSlug = slugify(p.author);
      let author = await prisma.author.findUnique({ where: { slug: authorSlug } });
      if (!author) {
        author = await prisma.author.create({
          data: { name: p.author, slug: authorSlug, nationality: p.nationality }
        });
      }
      const existing = await prisma.poem.findFirst({
        where: { title: p.title, authorId: author.id }
      });
      if (existing) {
        skipped++;
        continue;
      }
      const baseSlug = slugify(p.title);
      const poemSlug = uniqueSlug(baseSlug);
      await prisma.poem.create({
        data: {
          title: p.title,
          slug: poemSlug,
          content: p.content.trim(),
          excerpt: extractExcerpt(p.content),
          readingTime: estimateReadingTime(p.content),
          authorId: author.id,
          language: "ro",
          source: "classic"
        }
      });
      imported++;
    } catch (err) {
      errors.push(`${p.title}: ${String(err)}`);
    }
  }
  await prisma.importLog.create({
    data: {
      source: "romanian-classics",
      status: errors.length === 0 ? "success" : "partial",
      imported,
      skipped,
      errors: errors.length,
      details: errors.length > 0 ? errors.join("\n") : null
    }
  });
  return { ok: true, imported, skipped, errors: errors.length, errorDetails: errors };
});

export { romanian_post as default };
//# sourceMappingURL=romanian.post.mjs.map

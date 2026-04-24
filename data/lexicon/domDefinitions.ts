/**
 * Curated glossary notes for Romanian **differential object marking (DOM)** —
 * linking lemmas in `WriteLexiconWord` to short definitions for `/write`.
 * Lemmas must match lowercase forms used by {@link ../../lib/rhyme/lexiconRow.wordToLexiconFields}.
 */

export interface DomLexiconEntry {
  word: string
  definition: string
}

export const DOM_LEXICON_DEFINITIONS: readonly DomLexiconEntry[] = [
  {
    word: 'pe',
    definition:
      'Prepoziție folosită la obiectul direct personalizat sau la referințe hotărâte (persoane concrete, animale individuate, uneori obiecte definite): „îl văd pe Ion”, „am văzut-o pe mamă”. Fenomenul poartă numele de marcaj diferențial al obiectului (DOM).',
  },
  {
    word: 'marcaj',
    definition:
      'În sintaxa românei, „marcajul diferențial al obiectului” opune obiectul nepersonalizat (adesea fără „pe”) obiectului personalizat sau cu referință clară (adesea cu „pe”).',
  },
  {
    word: 'obiect',
    definition:
      'Obiect direct — complementul cerut de sensul unui verb tranzitiv. În română, forma după verb poate fi „pe” + compl. (DOM) când e vorba de persoane/animale individuate sau referințe definite.',
  },
  {
    word: 'prepoziție',
    definition:
      'Parte de vorbire invariabilă; în context DOM interesează în special „pe”, care introduce obiectul personalizat sau cu referință hotărâtă după mulți verbi tranzitivi.',
  },
  {
    word: 'personalizare',
    definition:
      'În gramatică (DOM): persoana sau lucrul sunt tratate ca individ unic sau „ca persoană”; obiectul apare tipic după „pe”: „îl caut pe doctor”.',
  },
  {
    word: 'referință',
    definition:
      'Legătura cu entitatea din discurs. Referința definită/specifică favorizează marcajul cu „pe” la obiectul direct față de obiectul generic sau nepersonalizat.',
  },
  {
    word: 'complement',
    definition:
      'Funcție sintactică; complementul direct poate fi marcat cu „pe” în română atunci când denum persoane sau animale individuate (DOM).',
  },
  {
    word: 'direct',
    definition:
      '„Obiect direct” — complementul principal al verbului tranzitiv; în română poate fi precedat de „pe” în context de DOM.',
  },
  {
    word: 'pronume',
    definition:
      'Unitate care înlocuiește nominalul; pronumele în caz obiect (îl, o, îi, le…) apare adesea împreună cu „pe” + nominal în construcții cu DOM („îl văd pe Ion”).',
  },
  {
    word: 'determinare',
    definition:
      'Precizarea sensului nominalului (articole, demonstrative etc.). Referința mai determinată favorizează „pe” la obiectul direct.',
  },
  {
    word: 'hotărât',
    definition:
      '„Referință hotărâtă” — entitate identificabilă în context; combinată cu verb tranzitiv, poate cere „pe” la obiectul personalizat (DOM).',
  },
  {
    word: 'nedeterminat',
    definition:
      '„Referință nedeterminată” — entitate nespecificată („un om” ca tip); la obiect direct nepersonalizat „pe” lipsește adesea („văd un om”).',
  },
  {
    word: 'definit',
    definition:
      'Nominal cu referință clar delimitată; obiectele definite cu sens individual pot apărea după „pe” în construcții DOM.',
  },
  {
    word: 'specific',
    definition:
      'Specific vs. generic: obiectul cu referință specifică (persoană sau animal anume) se marchează frecvent cu „pe”.',
  },
  {
    word: 'nume',
    definition:
      'Numele proprii la obiect direct cer aproape mereu „pe”: „îl cunosc pe Maria”.',
  },
  {
    word: 'propriu',
    definition:
      'Împreună cu „nume” — nume propriu; la obiect direct apare după „pe” (marcaj DOM).',
  },
  {
    word: 'animat',
    definition:
      'Substantive animate (oameni, animale concrete) la obiect direct sunt candidați principali pentru „pe” în română (DOM).',
  },
  {
    word: 'dublare',
    definition:
      'În română, „dublarea” obiectului — pronume clitic + „pe” + nominal („îl văd pe Ion”) — este un tipar frecvent legat de DOM.',
  },
  {
    word: 'substantiv',
    definition:
      'Parte de vorbire ce denumește ființe sau lucruri; substantivul la obiect direct poate fi introdus de „pe” în contexte de personalizare (DOM).',
  },
  {
    word: 'verb',
    definition:
      'Verbul tranzitiv cere complement direct; felul în care este exprimat (cu sau fără „pe”) depinde de DOM și de sens.',
  },
  {
    word: 'mamă',
    definition:
      'Substantiv de rudenie; la obiect personalizat: „o văd pe mamă” / variante cu „pe” conform contextului (DOM).',
  },
  {
    word: 'tată',
    definition:
      'Substantiv de rudenie; persoane individuate la obiect direct apar tipic după „pe”.',
  },
  {
    word: 'copil',
    definition:
      'Substantiv animat; ca obiect direct individualizat se folosește „îl/îi… pe copil(copiii)…” în registrul DOM.',
  },
  {
    word: 'fată',
    definition:
      'Substantiv animat; „pe fată” la obiect personalizat vs. „o fată” ca obiect nespecific în alt context.',
  },
  {
    word: 'băiat',
    definition:
      'Substantiv animat; construcțiile cu obiect direct personalizat includ frecvent „pe”.',
  },
  {
    word: 'femeie',
    definition:
      'Substantiv animat; „pe femeia aceea” vs. „văd o femeie” ilustrează opoziția dintre referință specifică și generică în DOM.',
  },
  {
    word: 'om',
    definition:
      '„Văd un om” (nedeterminat) vs. „îl văd pe omul acela” (hotărât) — exemplu clasic pentru opoziția DOM.',
  },
  {
    word: 'prieten',
    definition:
      'Substantiv animat; „pe prietenul meu” la obiect direct personalizat.',
  },
  {
    word: 'vecin',
    definition:
      'Persoană individuată la obiect direct: „îl salut pe vecin”.',
  },
  {
    word: 'soră',
    definition:
      'Rudenime; ca persoană concretă la obiect: construcții cu „pe” (DOM).',
  },
  {
    word: 'frate',
    definition:
      'Rudenime; la obiect personalizat folosește tiparul cu „pe”.',
  },
  {
    word: 'bunic',
    definition:
      'Substantiv animat — candidat tipic pentru „pe” la obiectul direct individualizat.',
  },
  {
    word: 'bunică',
    definition:
      'Substantiv animat — același tipar DOM ca pentru celelalte rude denumite.',
  },
  {
    word: 'elev',
    definition:
      'Substantiv animat („pe elevul X” când referința e specifică).',
  },
  {
    word: 'student',
    definition:
      'Substantiv animat; „pe studentul…” cu referință determinată.',
  },
  {
    word: 'profesor',
    definition:
      'Substantiv animat; „îl caut pe profesor” — exemplu frevent de DOM.',
  },
  {
    word: 'medic',
    definition:
      'Substantiv animat; „pe doctor/medic” la obiect personalizat.',
  },
  {
    word: 'doctor',
    definition:
      'Substantiv animat; „mergeți la doctor” (locativ) diferă de „îl văd pe doctor” (obiect DOM).',
  },
  {
    word: 'director',
    definition:
      'Substantiv animat — „îl aștept pe director”.',
  },
  {
    word: 'sef',
    definition:
      'Substantiv animat (forma fără diacritică uzuală în liste); „pe șef” în registrul DOM oral.',
  },
  {
    word: 'dușman',
    definition:
      'Substantiv animat; „îl urăsc pe dușman” vs. „urăsc dușmani” — personalizare și DOM.',
  },
  {
    word: 'iubit',
    definition:
      'Substantiv animat („pe iubitul meu”) sau participiu; în sens nominal animat cere adesea „pe” la OD.',
  },
  {
    word: 'câine',
    definition:
      'Animal individuat la obiect direct: „îl văd pe câine” / „văd un câine” — contrast DOM.',
  },
  {
    word: 'pisică',
    definition:
      'Animal domestic; animat individuat → tipar cu „pe”.',
  },
  {
    word: 'cal',
    definition:
      'Animal; ca individ denumit sau indicat clar poate fi marcat cu „pe” la obiect.',
  },
  {
    word: 'pasare',
    definition:
      'Animal (forma din dicționar fără diacritică); aceeași logică DOM ca pentru celelalte animate concrete.',
  },
]

function assertUniqueLemmaWords(entries: readonly DomLexiconEntry[]): void {
  const seen = new Set<string>()
  for (const e of entries) {
    if (seen.has(e.word)) throw new Error(`Duplicate DOM lemma in domDefinitions.ts: "${e.word}"`)
    seen.add(e.word)
  }
}

assertUniqueLemmaWords(DOM_LEXICON_DEFINITIONS)

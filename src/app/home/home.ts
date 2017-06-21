import {AfterViewInit, Component} from '@angular/core';
import {Subject} from 'rxjs';
import {Storage} from '@ionic/storage';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements AfterViewInit {

  constructor(private storage: Storage) {
  }

  ngAfterViewInit() {
    this.ratoweb();

    this.getDuration();
    this.getRegistry();
  }

  getDuration() {
    // use the duration stored if exists
    this.storage.get('duration')
      .then(duration => {
        if (duration) {
          this.duration = duration;
        }
      })
  }

  clearRegistry() {
    this.registry = [];
    this.storage.remove('registry');
  }

  getRegistry() {
    this.storage.get('registry')
      .then(registry => {
        if (registry) {
          this.registry = registry;
        }
      })
  }

  saveDuration(duration) {
    console.debug('duration change');
    this.storage.set('duration', duration);
  }

  public ABC = [
    ['a', 'e', 'i', 'o', 'u'],
    ['b', 'c', 'd', 'f', 'g'],
    ['h', 'j', 'k', 'l', 'm'],
    ['n', 'ñ', 'p', 'q', 'r'],
    ['s', 't', 'v', 'w', 'x'],
    ['y', 'z', ' ', '<-', '<-|']
  ];

  first;
  currentIndex;
  currentIndex2;
  duration = 1500;

  text;

  registry = [];

  updateIndex(currentVowelIndex) {
    if (this.first) {
      this.currentIndex = currentVowelIndex;
    } else {
      this.currentIndex2 = currentVowelIndex;
    }
  }

  async ratoweb() {
    let theMotherOfTheRato = this;

    const vowels: [Vowel] = this.ABC[0] as [Vowel];
    const consonants = this.ABC.slice(1);
    const vowelsIndex = {'a': 0, 'e': 1, 'i': 2, 'o': 3, 'u': 4};

    type Vowel = 'a' | 'e' | 'i' | 'o' | 'u';

    function getVowelIndex(vowel: Vowel): number {
      return vowelsIndex[vowel];
    }

    function getChar(vowel1: Vowel, vowel2: Vowel) {
      console.debug('getChar', vowel1, vowel2);
      let vowelIndex1 = getVowelIndex(vowel1);
      let vowelIndex2 = getVowelIndex(vowel2);
      return consonants[vowelIndex1][vowelIndex2];
    }

    let subject = new Subject<Vowel>();

    let currentVowelIndex;
    let interval = newCycle();

    async function cycle() {

      async function selectVowel1() {
        theMotherOfTheRato.first = true;
        return streamVowels.take(1).toPromise();
      }

      let streamVowels = subject.asObservable();

      let vowel1 = await selectVowel1();

      if (!vowel1) {
        return '';
      }

      interval = newCycle();

      async function selectVowel2() {
        theMotherOfTheRato.first = false;
        return streamVowels.take(1).toPromise();
      }

      let vowel2 = await selectVowel2();

      if (!vowel2) {
        return vowel1;
      }

      // vowel2 and vowel1 are inversed because the first vowel is the the cols.
      return getChar(vowel2, vowel1);
    }

    function backspace() {
      buffer = buffer.slice(0, -1);
    }

    function getBuffer() {
      return buffer;
    }

    function clearBuffer() {
      buffer = '';
    }

    function speach(txt) {
      console.info(txt);
      theMotherOfTheRato.registry.unshift({msg: txt, date: new Date()});
      theMotherOfTheRato.storage.set('registry', theMotherOfTheRato.registry);

      try {
        let msg = new SpeechSynthesisUtterance();

        let voices = window.speechSynthesis.getVoices();
        let spanishVoice = voices.map(voice => voice.lang).indexOf('es-ES');
        msg.voice = voices[spanishVoice];
        msg.text = txt;
        msg.lang = 'es-ES';

        speechSynthesis.speak(msg);
      } catch (e) {
        console.error(e);
      }
    }

    function addChar(char) {
      buffer += char;
    }

    function digest(char) {
      console.debug('digest', char);
      switch (char) {
        case '<-':
          backspace();
          break;
        case '<-|':
          speach(getBuffer());
          clearBuffer();
          break;
        default:
          addChar(char);
      }
      theMotherOfTheRato.text = getBuffer();
      theMotherOfTheRato.first = true;
      theMotherOfTheRato.currentIndex = -1;
      theMotherOfTheRato.currentIndex2 = -1;
    }

    function newCycle() {
      currentVowelIndex = -1;

      return setInterval(() => {
        currentVowelIndex++;

        if (currentVowelIndex >= vowels.length) {
          clearInterval(interval);
          currentVowelIndex = -1;
          console.debug('done!');
          subject.next(undefined);
        } else {
          console.log('--> ', vowels[currentVowelIndex]);
        }

        theMotherOfTheRato.updateIndex(currentVowelIndex);
      }, theMotherOfTheRato.duration);
    }


    document.addEventListener('click', () => {
      console.log('select vowel: ', vowels[currentVowelIndex]);
      subject.next(vowels[currentVowelIndex]);
      clearInterval(interval);
    });

    //test
    let buffer = '';

    while (true) {
      digest(await cycle());

      interval = newCycle();
    }

  }

}
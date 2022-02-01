const functions = require('firebase-functions');

const express = require('express')
const app = express()
var http = require('http');
const https = require('https');


const cors = require('cors')({origin: true});
app.use(cors);
const fetch = require('node-fetch');
const cheerio = require('cheerio');


const config = require("./configs/devConfig.json");
//const config = require("./configs/prodConfig.json"); //for produc env

const clientId = config.clientId
const clientSecret = config.clientSecret
const redirectUri = config.redirectUri; //for react site
const grant_type = config.grant_type;
const response_type = config.response_type;
const deeplAccessCode = config.deeplAccessCode;
  


const homeFunc = async (req, res) => {
  app.use(cors);

  const requestToken = req.query.code
  //const userInput = {songSearchKeywords:"doja cat juicy"}
  const userInput = {songSearchKeywords: req.query.state}

  
console.log('hit backend',req.query, new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))
// let words = ['Hello', 'World']
// words.forEach((word,i)=>
// {
//   (words[i] = word.split('').reverse().join('')).toLowerCase()
// })
// console.log(words)

return await fetch(`https://api.genius.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${requestToken}&grant_type=${grant_type}&redirect_uri=${redirectUri}&response_type=${response_type}`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        
      })
  .then((res)=>{
    if (res.ok){
        return res.json()
    } else {
      return Promise.reject(res); // 2. reject instead of throw
    }
  }) 
    .then(async (response) => {

      const accessToken = response.access_token


      var songMetadata = await songMetadataGetter(userInput, accessToken)

      var songMetadataLyrics = (await lyricsGetter(accessToken, songMetadata.path)).lyrics
      
      var translatedsongMetadataLyrics = (await translationGetter(songMetadataLyrics)).translations[0].text//.translations.text
      
      console.log(translatedsongMetadataLyrics)

      
      return res.status(200).send({ data: {lyrics: songMetadataLyrics, translatedLyrics:translatedsongMetadataLyrics, imageLink:songMetadata.primary_artist.image_url}})
    })
    .catch(e => {
        console.log(e)
        return res.sendStatus(400);
        });
        
};
app.use(homeFunc)


async function songMetadataGetter(userInput, accessToken){

  const songrequesturi = `https://api.genius.com/search?q=${userInput.songSearchKeywords}`
    
  const options = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
  };
   return fetch(songrequesturi, options)
   .then(async (res) =>  {
    var output = await res.json()
    //console.log('songMetadatagetter test', output.response.hits[0].result.primary_artist.image_url)
    var songMetadata = output.response.hits[0].result
    return songMetadata

  })
}

async function lyricsGetter(accessToken, songMetadata){

  return fetch(`https://genius.com${songMetadata}`, {
    method: 'GET',
  })
    .then(response => {
      if (response.ok) {
        //console.log(response)
        return response.text()
      }
      throw new Error('Could not get song url ...')
    })
      .then((htmlText) => {
        const $ = cheerio.load(htmlText)
        //console.log('test52', htmlText)

        var lyrics = $('.lyrics').text()
        //var lyrics = $('.lyrics').html()

        if (!lyrics){
          var lyrics = $('[class^=Lyrics__Container]').text()
          //console.log("test3",lyrics)
        }
 
        //console.log('test32', $('[class^=Lyrics__Container]').merge.html())
        // console.log('test32', $('[class^=Lyrics__Container]').attr('class'))
        //console.log('test32', $('[class^=Lyrics__Container]').xml())

        lyrics = lyrics ? lyrics : 'RETRIEVAL ERROR' 
        console.log('test1', lyrics)
        return {
          lyrics,
        }
      })
// })
.catch(e => {
console.log(e)
return e
});;

}


async function translationGetter(originalLyrics){
  var rawTextToTranslate = originalLyrics
  var maxLength = 26 // maximum number of characters to extract

  //trim the string to the maximum length
  var trimmedString = rawTextToTranslate.substr(0, maxLength);
  
  //re-trim if we are in the middle of a word
  textToTranslate = trimmedString.substr(0, /*Math.min(trimmedString.length, */trimmedString.lastIndexOf(" ")/*)*/)

  const targetLanguage = "ES"
  
  console.log(textToTranslate)
  var link = `https://api-free.deepl.com/v2/translate?auth_key=${deeplAccessCode}&text=${textToTranslate}&target_lang=${targetLanguage}`
  const encodedLink = encodeURI(link);


  //console.log('23', originalLyrics)
  // console.log('24', encodedLink)

  var options = 
  {
    method: 'GET',
    Host: 'api-free.deepl.com',
    "Content-Length": 54,
    "Content-Type": 'application/x-www-form-urlencoded',
  }

  return fetch(encodedLink, options)
    .then((response) => {
     //Transform http body to json
     //cant access deepl object properties bc json returns a promise. could 
     //either change this to await, or access properties outside of this block
    //  console.log('test31',response.headers)
    //return response.text();

    return response.json();
       
    })
      // .then((json)=> {
      //   res.send(json) //return json to browser
      // })
}


  app.get('/translate', (req, res) => {

    var testlyric= "[Verse 1] I got, I got, I got, I got— Loyalty, got royalty inside my DNA Cocaine quarter piece, got war and peace inside my DNA I got power, poison, pain, and joy inside my DNA I got hustle, though, ambition flow inside my DNA I was born like this, since one like this, immaculate conception I transform like this, perform like this, was Yeshua new weapon I don't contemplate, I meditate, then off your fucking head This that put-the-kids-to-bed This that I got, I got, I got, I got— Realness, I just kill shit 'cause it's in my DNA I got millions, I got riches buildin' in my DNA I got dark, I got evil that rot inside my DNA I got off, I got troublesome heart inside my DNA I just win again, then win again like Wimbledon, I serve Yeah, that's him again, the sound that engine in is like a bird You see fireworks and Corvette tire skrrt the boulevard I know how you work, I know just who you are See, you's a, you's a, you's a— Bitch, your hormones prolly switch inside your DNA Problem is, all that sucker shit inside your DNA Daddy prolly snitched, heritage inside your DNA Backbone don't exist, born outside a jellyfish, I gauge See, my pedigree most definitely don't tolerate the front Shit I've been through prolly offend you, this is Paula's oldest son I know murder, conviction Burners, boosters, burglars, ballers, dead, redemption Scholars, fathers dead with kids and I wish I was fed forgiveness Yeah, yeah, yeah, yeah, soldier's DNA (I'm a soldier's DNA) Born inside the beast, my expertise checked out in second grade When I was 9, on cell, motel, we didn't have nowhere to stay At 29, I've done so well, hit cartwheel in my estate And I'm gon' shine like I'm supposed to, antisocial extrovert And excellent mean the extra work And absentness what the fuck you heard And pessimists never struck my nerve And Nazareth gonna plead his case The reason my power's here on earth Salute the truth, when the prophet say [Bridge: Kendrick Lamar & Geraldo Rivera] I-I got loyalty, got royalty inside my DNA This is why I say that hip hop has done more damage to young African Americans than racism in recent years I-I got loyalty, got royalty inside my DNA I live a better life, I'm rollin' several dice, fuck your life I-I got loyalty, got royalty inside my DNA I live a be-, fuck your life 5, 4, 3, 2, 1 This is my heritage, all I'm inheritin' Money and power, the mecca of marriages [Verse 2] Tell me somethin' You mothafuckas can't tell me nothin' I'd rather die than to listen to you My DNA not for imitation Your DNA an abomination This how it is when you in the Matrix Dodgin' bullets, reapin' what you sow And stackin' up the footage, livin' on the go And sleepin' in a villa Sippin' from a Grammy, walkin' in the buildin' Diamond in the ceilin', marble on the floors Beach inside the window, peekin' out the window Baby in the pool, godfather goals Only Lord knows I've been goin' hammer Dodgin' paparazzi, freakin' through the cameras Eat at Four Daughters, Brock wearin' sandals Yoga on a Monday, stretchin' to Nirvana Watchin' all the snakes, curvin' all the fakes Phone never on, I don't conversate I don't compromise, I just penetrate Sex, money, murder—these are the breaks These are the times, level number 9 Look up in the sky, 10 is on the way Sentence on the way, killings on the way Motherfucker, I got winners on the way You ain't shit without a body on your belt You ain't shit without a ticket on your plate You ain't sick enough to pull it on yourself You ain't rich enough to hit the lot and skate Tell me when destruction gonna be my fate Gonna be your fate, gonna be our faith Peace to the world, let it rotate Sex, money, murder—our DNA"

    //var textToTranslate = "I got, I got, I got, I got— Loyalty, got royalty inside"
    //var textToTranslate =  "I got, I got, I got, I got"
    var textToTranslate = "Hello friend"

    const targetLanguage = "ES"
    //var link = `https://api-free.deepl.com/v2/translate?auth_key=${deeplAccessCode}&text=${textToTranslate}&target_lang=${targetLanguage}`
      var link = `https://api-free.deepl.com/v2/translate?auth_key=11d8971a-364c-d165-718c-27f9ace7150c:fx`

    var options = 
    {
      //method: 'GET',
      method: 'POST',
      headers: {
        "Host": 'api-free.deepl.com',
        "Content-Length": 54,
        "Content-Type": 'application/x-www-form-urlencoded',
        "User-Agent": "YourApp",
        "Accept": "*/*",

      },
      body: JSON.stringify({
        'auth_key': deeplAccessCode,
        'text': textToTranslate,
        'target_lang': targetLanguage
    }),
    }

  
    return fetch(link, options)
      .then((response) => {
        console.log(response)
        return response.json(); //Transform http body to json
      })
        .then((json)=> {
          res.send(json) //return json to browser
        })
        .catch(e => {
          console.log(e)
          return res.sendStatus(400);
          });
  })


  

// exports.getLyrics = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
//   console.log(response)

// });



function parseSongHTML(htmlText) {
  const $ = cheerio.load(htmlText)
  const lyrics = $('.lyrics').text()
  console.log(lyrics)
  return {
    lyrics,
  }
}

exports.app = functions.https.onRequest(app);

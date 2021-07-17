const functions = require('firebase-functions');

const express = require('express')
const app = express()
const port = 3035
var http = require('http');
const https = require('https');

const cors = require('cors')//({origin: true});
app.use(cors({ origin: true }));

var axios = require('axios');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { access } = require('fs');



const clientId = 'zMNZDYvktFEeAK3Qujfyrt5ActZwYpvvlJwATeprRbLAz3hxp2rZpX3YSHqzRhDC';
const clientSecret = 'gfYzi2KJWBeWNRxklmBeOvSeYkaPqPlp1-AWRR4rEp2x4aLB-kkBHbUVesAg84UQdYAMz9ood7Ygn2-iCrMK0Q';
//const redirectUri = 'http://localhost:3035/home'; //for functions
const redirectUri = 'http://localhost:3000/landing'; //for react site

const grant_type = "authorization_code";
const response_type = "code";

const deeplAccessCode = "11d8971a-364c-d165-718c-27f9ace7150c:fx";

//try blocks

app.get('/auth', (req, res) => {
    res.redirect(`https://api.genius.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=me&state=SOME_STATE_VALUE&response_type=code`)
  })
  
  

app.get('/home', async (req, res) => { //change name to auth_success
    const requestToken = req.query.code
    const userInput = {songSearchKeywords:"kendrick lamar dna"}

  console.log('hit backend')
  return await fetch(`https://api.genius.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${requestToken}&grant_type=${grant_type}&redirect_uri=${redirectUri}&response_type=${response_type}`, {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
        })

    .then((res)=>{
        return res.json()
    }) 
      .then(async (response) => {

        const accessToken = response.access_token


        var songPath = await songPathGetter(userInput, accessToken)

        // redirect the user to the welcome page, along with the access token
        //res.redirect(`/lyric?access_token=${accessToken}`)
        //res.redirect(`http://localhost:3000`)

        // await lyricsGetter(accessToken, songPath)
        // .then(output => res.status(200).send({ data: output}));
        var songPathLyrics = (await lyricsGetter(accessToken, songPath)).lyrics
        
        var translatedSongPathLyrics = (await translationGetter(songPathLyrics)).translations[0].text//.translations.text

        // console.log(translatedSongPathLyrics.translations[0].text)
        // console.log(JSON.stringify(translatedSongPathLyrics.translations[0].text))
        //console.log(JSON.stringify(translatedSongPathLyrics))

        console.log(translatedSongPathLyrics)

        
        return res.status(200).send({ data: {lyrics: songPathLyrics, translatedLyrics:translatedSongPathLyrics}})

      })
      .catch(e => {
          console.log(e)
          return res.sendStatus(400);
          });
})


async function songPathGetter(userInput, accessToken){

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
    var songPath = output.response.hits[0].result.path
    return songPath

  })
}

async function lyricsGetter(accessToken, songPath){

  return fetch(`https://genius.com${songPath}`, {
    method: 'GET',
  })
    .then(response => {
      if (response.ok) return response.text()
      throw new Error('Could not get song url ...')
    })
      .then((htmlText) => {
        const $ = cheerio.load(htmlText)

        var lyrics = $('.lyrics').text()

        if (!lyrics){
          var lyrics = $('[class^=Lyrics__Container]').text()
        }

        lyrics = lyrics ? lyrics : 'RETRIEVAL ERROR' 
        //console.log('test1', lyrics)
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




app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })









  
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.getLyrics = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
  console.log(response)

});



function parseSongHTML(htmlText) {
  const $ = cheerio.load(htmlText)
  const lyrics = $('.lyrics').text()
  console.log(lyrics)
  return {
    lyrics,
  }
}


//example fetch code w axios
    // axios({
    //   // make a POST request
    //   method: 'post',
    //   // to the Github authentication API, with the client ID, client secret
    //   // and request token
    //   url: `https://api.genius.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${requestToken}&grant_type=${grant_type}&redirect_uri=${redirectUri}&response_type=${response_type}`,
    //   // Set the content type header, so that we get the response in JSOn
    //   headers: {
    //        accept: 'application/json'
    //   }
    // })

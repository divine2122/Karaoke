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

        await lyricsGetter(accessToken, songPath).then(output => res.status(200).send({ data: output}));

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

  app.get('/translate', (req, res) => {

    var textToTranslate = "Hello friend"
    const targetLanguage = "ES"
    var link = `https://api-free.deepl.com/v2/translate?auth_key=${deeplAccessCode}&text=${textToTranslate}&target_lang=${targetLanguage}`

    var options = 
    {
      method: 'GET',
      Host: 'api-free.deepl.com',
      "Content-Length": 54,
      "Content-Type": 'application/x-www-form-urlencoded',
    }
    return fetch(link, options)
      .then((response) => {
        return response.json(); //Transform http body to json
      })
        .then((json)=> {
          res.send(json) //return json to browser
        })
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

const functions = require('firebase-functions');

const express = require('express')
const app = express()
const port = 3035
var http = require('http');
const https = require('https');

const cors = require('cors')({origin: true});
var axios = require('axios');
const fetch = require('node-fetch');
const cheerio = require('cheerio');



const clientId = 'zMNZDYvktFEeAK3Qujfyrt5ActZwYpvvlJwATeprRbLAz3hxp2rZpX3YSHqzRhDC';
const clientSecret = 'gfYzi2KJWBeWNRxklmBeOvSeYkaPqPlp1-AWRR4rEp2x4aLB-kkBHbUVesAg84UQdYAMz9ood7Ygn2-iCrMK0Q';
const redirectUri = 'http://localhost:3035/home';
const grant_type = "authorization_code";
const response_type = "code";

const deeplAccessCode = "11d8971a-364c-d165-718c-27f9ace7150c:fx";

//try blocks

app.get('/auth', (req, res) => {
    res.redirect(`https://api.genius.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=me&state=SOME_STATE_VALUE&response_type=code`)
  })
  


  // app.get('/home', (req, res) => {
  //   const requestToken = req.query.code
  //   console.log(requestToken)

  //   const uri = `https://api.genius.com/oauth/token`;
  //     const options = {
  //         method: 'POST',
  //         body: JSON.stringify({
  //               "code": requestToken,
  //               "client_id": clientId,
  //               "client_secret": clientSecret,
  //               "redirect_uri": redirectUri,
  //               "response_type": response_type,
  //               "grant_type": grant_type,
  //         }),
  //     };
  //     return fetch(uri, options)
  //       .then((res) => {
  //         console.log(res)
  //           if (res.ok) {
  //               return res.json();
  //           } else if (res.status == 409) {
  //               throw new Error('IdP configuration already exists. Update it instead.');
  //           } else {
  //             console.log('test spot')
  //             throw new Error(res.statusText)
  //           }
  //       })
  //         .then(json => {
  //           const accessToken = json.access_token
  //           res.redirect(`/lyric?access_token=${accessToken}`)

  //           //res.send(json);  // will send status 200 and the json as body 
  //         })
  //         .catch(e => {
  //           console.log(e)
  //           res.sendStatus(400);  //or whatever status code you want to return
  //         });;

  // })
  
  
app.get('/home', (req, res) => {
    const requestToken = req.query.code

  fetch(`https://api.genius.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&code=${requestToken}&grant_type=${grant_type}&redirect_uri=${redirectUri}&response_type=${response_type}`, {
          method: 'post',
          headers: { 'Content-Type': 'application/json' },
        })
    .then((res)=>{
        return res.json()
    }) 
      .then((response) => {
        const accessToken = response.access_token
        // redirect the user to the welcome page, along with the access token
        //res.redirect(`/lyric?access_token=${accessToken}`)
        testFunc(accessToken)
      })
      .catch(e => {
          console.log(e)
          res.sendStatus(400);
          });
})

function testFunc(accessToken){
  //app.get('/lyric', (req, res) => {
    //const accessToken = req.query.access_token 
    const uri = `https://api.genius.com/songs/3035222`

    const options = {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${accessToken}`
          },
    };
    
    return fetch(uri, options).then(async (res) =>  {
      var output = await res.json()
        if (res.ok) {
            return output
        } else if (res.status == 409) {
            throw new Error('IdP configuration already exists. Update it instead.');
        } else {
            throw new Error(res.statusText)
        }
    })
        .then(json => {
          var chosen_song_path = json.response.song.path
          
          //res.send(json);  // will send status 200 and the json as body 
          //this will eventually fetch rapgenius title to populate user chosen link from above fetch
            return fetch(`https://genius.com${chosen_song_path}`, {
              method: 'GET',
            })
              .then(response => {
                if (response.ok) return response.text()
                throw new Error('Could not get song url ...')
              })
                .then((htmlText) => {
                  const $ = cheerio.load(htmlText)
                  const lyrics = $('.lyrics').text()
                  console.log(lyrics)
                  return {
                    lyrics,
                  }
                })
        })
        .catch(e => {
          console.log(e)
         // res.sendStatus(400);  //or whatever status code you want to return
        });;
  //})
}

  app.get('/translate', (req, res) => {

    var textToTranslate = "Hello friend"
    const targetLanguage = "ES"
    var link = `https://api-free.deepl.com/v2/translate?auth_key=${deeplAccessCode}&text=${textToTranslate}&target_lang=${targetLanguage}`

    var options = 
    {
      method: 'GET',
      Host: 'api-free.deepl.com',
      //User-Agent: 'YourApp',
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

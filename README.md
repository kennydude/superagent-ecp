
# superagent-oauth

A handy [superagent](https://github.com/visionmedia/superagent) plugin to use ECP to auth
requests for you

## Example

```js
var url = "https://printing.johnscompany.com/balance",
	username = "john",
	password = "somepassword",
	ecp = "https://gateway.johnscompany.com/idp/profile/SAML2/SOAP/ECP";

// Libraries
var request = require("superagent");
require("./superagent-ecp")(request); // Add ECP

request
  .get(url)
  .buffer(true)
  .ecp(ecp, username, password, function(req){
    req.end(function (res) {
      console.log(res.status);
      var p = res.text.indexOf("£");
      console.log("Print Credit: " + res.text.substring( p, res.text.indexOf("<", p) ));
    });
  });
```

## API

### Request#ecp

```js
Request#ecp(idp_endpoint, username, password)
```

- **idp_endpoint**: (`String`) Endpoint for IDP Authentication
- **username**: (`String`) Username to access the resource with
- **password**: (`String`) Passwod to access with. Shocking as it is, this whole complex
ECP thing literally uses plain-text :O

#### idp_endpoint guessing

You can guess this fairly easy. If you try and use the service by-hand (and depending if ECP
is enabled for the resource in question).

For example if when you access the resource you are redirected to something like
`https://idp.mycompany.com/idp/Authnengine`

Then you simply take from `/idp/` and make it `/idp/idp/profile/SAML2/SOAP/ECP`

## Credits

(The MIT License)

Copyright (c) 2013 Joe Simpson

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

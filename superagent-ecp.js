
module.exports = function (superagent) {

  /**
   * Module dependencies.
   */

  var Request = superagent.Request;
  var et = require('elementtree');
  var CookieJar = require('cookiejar').CookieJar;
  var CookieAccess = require('cookiejar').CookieAccessInfo;
  var parse = require('url').parse;

  et.register_namespace("S", "http://schemas.xmlsoap.org/soap/envelope/");

  var oldQuery = Request.prototype.query;

  // debug
  var ecp_debug_on = false;
  function ecp_debug(){
    if(ecp_debug_on){ console.log.apply(this, arguments); }
  }
  superagent.ecp_debug = function(val){
    if(val == true || val == false) ecp_debug_on = val;
  }

  /**
   * ECP Authenticate this request
   *
   * @param {String} ECP Endpoint
   * @param {String} Username
   * @param {String} Password (plain-text only please, sorry)
   * @api public
   */

  Request.prototype.ecp = function (ecp, username, password, cb) {
    this.ecp = {
      "endpoint" : ecp,
      "username" : username,
      "password" : password
	};
    this.startECP(cb);
  };

  Request.prototype.startECP = function (cb) {
     // Initial probe for an envelope
     ecp_debug("ECP: Starting ECP");
     var self = this;
     
     superagent
       .get(this.url)
       .buffer(true)
       .set("Accept", "text/html; application/vnd.paos+xml")
       .set("PAOS", 'ver="urn:liberty:paos:2003-08";"urn:oasis:names:tc:SAML:2.0:profiles:SSO:ecp"')
       .end(function(res){ // Could probably be written better. Oh well
         ecp_debug("ECP: ", res.text);
         var etree = et.parse(res.text);
         ecp_debug("ECP");
         self.relay_state = etree.find(".//ecp:RelayState");
         ecp_debug("ECP", self.relay_state);

         
         var hh = etree.find(".//S:Header");
         etree.getroot().remove(0, hh); // TODO: On next release of ETree, fix this
         self.ecp_body = etree.write();
         self.idpECP.apply(self,[cb]);
       });
  }

  function removeByIndex(arr, index) {
	  arr.splice(index, 1);
  }

  Request.prototype.idpECP = function (cb) {
     // Now do the IDP
     ecp_debug("ECP: IDP");
     var self = this;
     superagent
        .post(this.ecp.endpoint)
        .send(this.ecp_body)
        .auth(this.ecp.username, this.ecp.password)
        .end(function(res){
           //ecp_debug("ECP: ", res.text);
           var etree = et.parse(res.text);

           var consumer_serv = etree.find(".//ecp:Response").attrib['AssertionConsumerServiceURL'];
           // TODO: Assert customer service URL
           // Now we make the body for the final request!
           // Remove the junk we get
           var junk = etree.find(".//ecp:Response");
           var soapH = etree.find(".//soap11:Header"); ecp_debug("ECP HEADER", soapH);
           soapH.remove(0,junk); // TODO: Same as above

           for(key in self.relay_state.attrib){
             if(key.indexOf("S:") === 0){
                self.relay_state.attrib[ key.replace("S:", "soap11:")] = self.relay_state.attrib[key];
                delete self.relay_state.attrib[key];
             }
           }
           soapH.insert(0,self.relay_state);

           // Prepare to send to the consumer service
           self.ecp_jar = new CookieJar; ecp_debug(etree.write());
           superagent
             .post(consumer_serv)
             .send(etree.write())
             .redirects(0)
             .set("Content-Type", "application/vnd.paos+xml")
             .end(function(res){
                ecp_debug("ECP: Final.");
                // Grab the cookies
                var cookies = res.headers['set-cookie'];
                if (cookies) self.ecp_jar.setCookies(cookies);
                
                // Now apply any we need to our finalie
                var url = parse(self.url);
                var access = CookieAccess(url.host, url.pathname, 'https:' == url.protocol);
                var cookies = self.ecp_jar.getCookies(access).toValueString();
                self.cookies = cookies;
                // cb
                cb(self);
             });
        });
  }

  /**
   * Overrides .end() to add the Auth.
   */

  var oldEnd = Request.prototype.end;

  Request.prototype.end = function () {
    this.end = oldEnd;

    ecp_debug("ECP: Request.end()");

    return this.end.apply(this, arguments);
  }

}

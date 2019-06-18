document.addEventListener("DOMContentLoaded", function() {
   var access_token_url = document.getElementById("access-token-url"),
       discovery_url = document.getElementById("api-discovery-config-url"),
       discovery_config = document.getElementById("api-discovery-config");
   fetch(discovery_url.href)
     .then(res => res.json())
     .then((data) => {
        access_token_url.href = access_token_url.innerHTML = data.urls.accessToken;
        discovery_config.innerHTML = JSON.stringify(data, null, 2);
     })
     .catch(err => { throw err });
});

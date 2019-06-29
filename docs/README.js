function assignUrl(className, url) {
  const elems = Array.from(document.getElementsByClassName(className));
  elems.forEach(elem => {
     elem.href = elem.innerHTML = url;
  })
}

document.addEventListener("DOMContentLoaded", function() {
  const discovery_url = "https://aim.thestrawgroup.com/api.json"
  fetch(discovery_url)
    .then(res => res.json())
    .then((data) => {
      Object.keys(data.v1.urls).forEach(name => {
        assignUrl(`${name}-url`, data.v1.urls[name])
      });
      assignUrl("discovery-config-url", discovery_url)
      document.getElementById("discovery-config").innerHTML = JSON.stringify(data, null, 2);
    })
    .catch(err => { throw err });
});

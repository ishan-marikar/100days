var hist;
function updateHistory(){
  chrome.history.search({text: ''}, function (histArray){
    hist = histArray;
    console.log(hist);
  });
}
updateHistory();

function cleanup(){
  clearCache();
  updateHistory();
}

function getNext(tab){
  var domain = tab.url.match(/http?.:\/\/.*?\//);

  console.log('domain ', domain);

  // chrome.history.search({text: ''}, function (histArray){
    // var hist = histArray;
    // console.log(hist);

    for (var i = 1; i < hist.length; i++){
      var fullUrl = hist[i].url;
      if (fullUrl.indexOf(domain) != -1){
        tabPages[tab.id].next = hist[i-1].url;
        break;
      }
    }

    console.log('next', tabPages[tab.id].next);


    if (tabPages[tab.id].next){
      chrome.tabs.update(tab.id, {url: tabPages[tab.id].next}, function (tab){
        tabPages[tab.id].loading = true;
      });
    } else {
      tabPages[tab.id].processing = false;
      tabPages[tab.id].loading = false;
      cleanup();
    }

  // });

}

var tabPages = {};
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab){
  console.log(tab);

  if (tab.url.indexOf('http') === 0){
    if (!tabPages.hasOwnProperty(tabId)){
      tabPages[tabId] = {
        requested: undefined,
        next: undefined,
        processing: false,
        loading: false
      };
    }

    if (!tabPages[tabId].processing && tab.url != tabPages[tabId].next){
      tabPages[tabId].processing = true;
      tabPages[tabId].requested = tab.url;
      getNext(tab);
    }

    if (tabPages[tabId].loading && changeInfo.status == 'complete'){
      tabPages[tabId].processing = false;
      tabPages[tabId].loading = false;
      cleanup();
    }
  }
});

function clearCache(){
  chrome.browsingData.removeCache({}, function (){
    console.log('cache cleared');
  });
}
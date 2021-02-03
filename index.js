function namehash(name) {
  const hashArray = hash(name);
  return arrayToHex(hashArray);
}

function hash(name) {
  if (!name) {
      return new Uint8Array(32);
  }
  const [label, ...remainder] = name.split('.');
  const labelHash = keccak_256.array(label);
  const remainderHash = hash(remainder.join('.'));
  return keccak_256.array(new Uint8Array([...remainderHash, ...labelHash]));
}

function arrayToHex(arr) {
  return '0x' + Array.prototype.map.call(arr, x => ('00' + x.toString(16)).slice(-2)).join('');
}

function cleanDOM(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function displayResolution(resolution) {
  const {ownerAddress, resolverAddress, records} = resolution;
  const mainContainer = document.getElementById('records');

  cleanDOM(mainContainer);

  const ownerRecord = document.createElement('span');
  ownerRecord.innerHTML = `ownerAddress: ${ownerAddress}`;
  const resolverRecord = document.createElement('span');
  resolverRecord.innerHTML = `resolverAddress: ${resolverAddress}`;

  mainContainer.appendChild(ownerRecord);
  mainContainer.appendChild(resolverRecord);

  Object.entries(records).map(([key, value]) => {
    const recordSpan = document.createElement('span');
    if (!value) {
      recordSpan.style.color = 'red';
      value = `No ${key} found`;
    }
    recordSpan.innerHTML = `${key} : ${value}`;
    mainContainer.appendChild(recordSpan);
  });
}

function combineKeysWithRecords(keys, records) {
  const combined = {};
  keys.map((key, index) => {
    combined[key] = records[index];
  });
  return combined;
}

function displayError(message, cleanDom) {
  const mainContainer = document.getElementById('records');
  if (cleanDom) {
    cleanDOM(mainContainer);
  }
  const error = document.createElement('p');
  error.style.color = "red";
  error.innerHTML = message;
  mainContainer.appendChild(error);
  return ;
}

function isEmpty(msg) {
  return !msg || msg === '0x0000000000000000000000000000000000000000';
}


async function resolve() {
  const userInput = document.getElementById("input").value;

  if (!userInput.endsWith(".crypto")) {
    displayError('domain is not support', true);
    return ;
  }
  const tokenId = namehash(userInput);
  
  const interestedKeys = [
    "crypto.BTC.address",
    "crypto.ETH.address",
  ];
  
  fetchContractData(interestedKeys, tokenId).then(data => {
    if (isEmpty(data.owner)) {
      displayError('Domain is not registered', true);
      return ;
    }

    if (isEmpty(data.resolver)) {
      displayError('Domain is not configured', true);
      return ;
    }

    displayResolution({
      ownerAddress: data.owner,
      resolverAddress: data.resolver,
      records: combineKeysWithRecords(interestedKeys, data[2])
    });
  });
}
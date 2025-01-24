console.log('Service Worker Loaded');

function appendExtensionInbound(path, extension) {
  // append the extension only if the path does not already end with it
  if (!path.endsWith(extension)) {
    if (extension === '.json' && !path.endsWith('.hlx')) {
      // append .hlx extension if the path does not already end with it. The Spreadsheet and Taxonomy Servlets needs to be called with
      // .hlx selector.
      path += '.hlx';
    }
    path += extension;
  }
  return path;
}

function mapInbound(originalPath, cfg) {
  if (cfg.mappings) {
    let path = originalPath;
    let extension = '';
    const extensionStart = path.lastIndexOf('.');
    if (extensionStart >= 0) {
      extension = path.substring(extensionStart);
      path = path.substring(0, path.length - extension.length);
    }

    // test the path without extension, and the original path
    const candidates = [path, originalPath];
    const reversedMappings = cfg.mappings.reverse();

    for (let i = 0; i < reversedMappings.length; i += 1) {
      const mapping = reversedMappings[i];
      const [aemBasePath, franklinBasePath] = mapping.split(':', 2);
      for (let j = 0; j < candidates.length; j += 1) {
        const candidate = candidates[j];
        if (candidate.startsWith(franklinBasePath)) {
          // mapping from folder or single page?
          if (aemBasePath.endsWith('/')) {
            // folder, e.g. /content/site/us/en/:/us/en/
            // mapping to folder
            if (franklinBasePath.endsWith('/')) {
              return appendExtensionInbound(
                aemBasePath + candidate.substring(franklinBasePath.length),
                extension,
              );
            }
            // else, ignore folder => single page as this is not reversible
          } else {
            // single page
            // mapping to a folder aka. /index, e.g. /content/site/us/en:/
            // mapping to a single page, aka. exact match, /content/site/us/en/page:/vanity
            // eslint-disable-next-line no-lonely-if
            if ((franklinBasePath.endsWith('/') && candidate.endsWith('/index')) || franklinBasePath === candidate) {
              return appendExtensionInbound(aemBasePath, extension);
            }
          }
        }
      }
    }
    // restore extension
    return appendExtensionInbound(path, extension);
  }
  return originalPath;
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

self.addEventListener('fetch', (event) => {
  console.log(event);
  // ignore for non-GET and navigate requests.
  if (event.request.mode === "navigate" || event.request.method !== "GET") return;
  const { origin, pathname } = new URL(event.request.url);
  if (origin !== self.location.origin) return;
  const { mode, headers, method, credentials } = event.request;

  if (pathname.startsWith('/mhaack/citisignal-one')) {
    return;
  }

  console.log(`Rewriting ${pathname} to https://main--citisignal-one--mhaack.aem.live${pathname}`);

  event.respondWith(fetch(`https://main--citisignal-one--mhaack.aem.live${pathname}`, { mode, headers, method, credentials }));

  // const opts = { mode, headers, method, credentials };
  // const resourceEndpoint = self.location.pathname.substring(0, self.location.pathname.length - 5);
  // const sitePath = resourceEndpoint.substring(0, resourceEndpoint.length - 10);
  //
  // // route media bus request through resource proxy directly
  // if (pathname.match(/\/media_[a-z0-9]*(\.[^/]+)?$/)) {
  //   console.debug(`forward to hlx: ${pathname}`);
  //   event.respondWith(fetch(new URL(resourceEndpoint + pathname.substring(1), self.location), opts));
  //   return;
  // }
  //
  // // ignore some well-known paths
  // if (pathname.startsWith(resourceEndpoint)
  //   || pathname.startsWith('/content/')
  //   || pathname.startsWith('/etc.clientlibs/')
  //   || pathname.startsWith('/conf/')
  //   || pathname.startsWith('/etc/')
  //   || pathname.startsWith('/var/')
  //   || pathname.startsWith('/libs/')
  //   || pathname.startsWith('/apps/')
  //   || pathname.startsWith('/bin/')
  //   || pathname.startsWith('/graphql/execute.json')) {
  //   console.debug(`exclude aem content: ${pathname}`);
  //   return;
  // }
  //
  //
  // // fetch the paths.json, map the pathname in inbound direction, and fetch the mapped path as response to the
  // // initial event
  // // TODO: if we are in the launch we should try to fetch the resource from the launch
  // event.respondWith(
  //   fetch(new URL(resourceEndpoint + 'paths.json', self.location), opts)
  //     .then((pathsYaml) => {
  //       if (!pathsYaml.ok) {
  //         // define a simple fallback mapping
  //         console.warn('paths.json not found, falling back to default mapping.');
  //         return { mappings: [`${sitePath}/:/`] };
  //       } else {
  //         return pathsYaml.text().then((text) => JSON.parse(text));
  //       }
  //     })
  //     .then((cfg) => mapInbound(pathname, cfg))
  //     .then((mappedPathname) => {
  //       console.debug(`forward to hlx: ${pathname}`);
  //       return fetch(new URL(mappedPathname, self.location), opts);
  //     })
  // );
});


import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

export class GoogleDriveManager extends BaseHTMLComponentWithEvent {
    constructor() {
        super();
        this.statusDiv = document.getElementById('status');
        this.errorDiv = document.getElementById('error');
        this.filesDownloadSelect = document.getElementById('files_download');
        this.nodeDocument = document.getElementById('nodeDocument');
        this.gapiInited = false;
        this.gisInited = false;
        this.tokenClient = null;
        this.registerId();
        this.eventInfo = this.retrieveEventInfo();
    }
  
    async gapiLoad() { 
      const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
      const SCOPES = 'https://www.googleapis.com/auth/drive';
      
      let client_id = localStorage.getItem('client_id');
      let api_key = localStorage.getItem('api_key');
      if (!(client_id && api_key )){
        const jsonkeyInput = document.getElementById('jsonkeyInput');
        const d  = JSON.parse(jsonkeyInput.value); 
        client_id =  d.client_id;
        api_key   =  d.api_key;
        localStorage.setItem('api_key',d.api_key);
        localStorage.setItem('client_id',d.client_id);
        jsonkeyInput.value = "";
      }
    
      await gapi.load('client', async ()=>{
          
          await gapi.client.init({
            apiKey: api_key,
            discoveryDocs: [DISCOVERY_DOC],
          });
          this.gapiInited = true;
      });
        
      this.tokenClient = await google.accounts.oauth2.initTokenClient({
        client_id: client_id,
        scope: SCOPES,
        callback: '', // defined later
      });
      this.gisInited = true;
    }
    
    async initializeGapi() {
        try {
          await this.gapiLoad(); // gisLoaded() の処理が終了するまで待機
          console.log('gisLoaded() has completed successfully.');
        } catch (error) {
            console.error('Error during gisLoaded execution:', error);
        }
  
        ((interval = 100, timeout = 10000)=> {
          const startTime = Date.now();
  
          function checkInitialized() {
              if (driveManager.gapiInited && driveManager.gisInited) {
                  console.log('gisLoaded() has completed successfully.');
                  driveManager.accessCert(); // 完了時にコールバックを実行
              } else if (Date.now() - startTime > timeout) {
                  console.error('Timeout waiting for gisLoaded() to complete.');
              } else {
                  setTimeout(checkInitialized, interval); // 再試行
              }
          }
  
          checkInitialized();
        })();
    }
  
    async accessCert() {
        if (!gapi || !gapi.client) {
            localStorage.removeItem('api_key');
            localStorage.removeItem('client_id');
            console.error('gapi or gapi.client is not loaded.');
            throw new Error('gapi or gapi.client is not available.');
        }
  
        this.tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw resp;
            }
  
            localStorage.setItem('access_token', resp.access_token);
            localStorage.setItem('token_type', resp.token_type);
            localStorage.setItem('expires_in', resp.expires_in);
            localStorage.setItem('scope', resp.scope);
  
            document.getElementById('loadDataButton').query().innerText  = 'Reflesh';
            this.downloadableFiles();
        };
  
        const refresh = document.getElementById('loadDataButton').query().innerText === 'Reflesh';
        const accessToken = refresh ? "" : localStorage.getItem('access_token');
        if (accessToken) {
            gapi.client.setToken({
                access_token: accessToken,
                token_type: localStorage.getItem('token_type'),
                expires_in: localStorage.getItem('expires_in'),
                scope: localStorage.getItem('scopes'),
            });
            this.downloadableFiles();
            document.getElementById('loadDataButton').query().innerText = 'Reflesh';
        } else {
            if (gapi.client.getToken() === null) {
                this.tokenClient.requestAccessToken({ prompt: 'consent' });
            } else {
                this.tokenClient.requestAccessToken({ prompt: '' });
            }
        }
    }
    
    files_walk(q,cb){
      
      return  async function() {
       
        const searchResponse = await gapi.client.drive.files.list({
          q: q,
          fields: 'files(id, name)',
        })
          .then(cb);
      }
    
    }
    create_options(fileSelector,files,label ="名前："){
      if (files && files.length > 0) {
          files.forEach((file) => {
            const option = document.createElement('option');
            option.value = file.id;
            option.textContent = `${label} ${file.name}`;
            fileSelector.appendChild(option);
          });
        console.log('Files loaded into selector.');
      } else {
        console.error('No files found in the specified folder.');
        throw new Error('No files found');
      }
    
  
    }
    async downloadableFiles() {
      const folderId ='1dppnTOWb7mAc35dQYvkOlXU-GnmzL4ha'; // Replace with the actual folder ID
      const schedule_folderId = '1zdPsgrZ70N1rb1G8R8akWYusp4ErBB3F';
      const create_selctor = (response)=> {
        const fileSelector = document.getElementById('files_download');
        fileSelector.innerHTML = ''; // Clear existing options
        this.create_options(fileSelector,response.result.files,"ジェイソン：");
      };
  
      const get_gdoc_link = (response) => {
            const files = response.result.files;
            if (files && files.length > 0) {
                const fileSelector = nodeDocument;
                fileSelector.innerHTML = ''; // Clear existing options
                
                const option = document.createElement('option');
                option.value = JSON.stringify({ id:"",label:"",href :""}); 
                option.textContent = `Not File.`;
                fileSelector.appendChild(option);
  
                files.forEach(function(file) {
                    gapi.client.drive.permissions.create({
                        'fileId': file.id,
                        'resource': {
                            'role': 'reader',
                            'type': 'anyone',
                            'allowFileDiscovery': false
                        }
                    }).then(function(response) {
                        gapi.client.drive.files.get({
                            'fileId': file.id,
                            'fields': 'webViewLink'
                        }).then(function(response) {
                          
                          const option = document.createElement('option');
                          option.value =JSON.stringify({ id:file.id,label:file.name,href :response.result.webViewLink }); 
                          option.textContent = `GDOC: ${file.name}`;
                          fileSelector.appendChild(option);
                          console.log(file.name + ' の共有リンク: ' + response.result.webViewLink);
                          
                        });
                    });
                });
            } else {
                console.log('No files found.');
            }
      };
  
  
      const query = `'${folderId}' in parents and trashed = false`; 
      await this.files_walk( query,create_selctor)();
  
      const query2 = `'${schedule_folderId}' in parents and mimeType='application/vnd.google-apps.document'`;
      await this.files_walk(query2,get_gdoc_link)();
    }
  
    populateFileSelector(selector, files, label) {
        selector.innerHTML = '';
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.id;
            option.textContent = `${label} ${file.name}`;
            selector.appendChild(option);
        });
    }
    
    onFileListSuccess(files) {
      statusDiv.textContent = 'ステータス: アイドル';
      filesDownloadSelect.innerHTML = '<option value="">選択してください</option>'; // クリア
      if (files && files.length > 0) {
          files.forEach(file => {
              const option = document.createElement('option');
              option.value = file.id;
              option.textContent = file.name;
              filesDownloadSelect.appendChild(option);
          });
      } else {
           statusDiv.textContent = 'ステータス: 保存済みファイルが見つかりません。';
      }
      console.log('File list loaded:', files);
  }
  
    populateFileList() {
      statusDiv.textContent = 'ステータス: ファイルリスト取得中...';
      errorDiv.textContent = '';
      console.log('Fetching file list...');
      // NOT IMPLEMENTED: google.script.run でサーバーサイド関数 (getDownloadableFilesInfo) を呼び出す
      // google.script.run.withSuccessHandler(onFileListSuccess).withFailureHandler(onApiError).getDownloadableFilesInfo();
      setTimeout(() => { // ダミーの遅延
          const dummyFiles = [
              { id: 'file1', name: 'graph_save_1.json'},
              { id: 'file2', name: 'another_graph.json'}
          ];
          this.onFileListSuccess(dummyFiles); // ダミー成功
          // onApiError({ message: 'Dummy file list error' }); // ダミー失敗
      }, 500);
  }
  
    onUploadSuccess(fileInfo){
      statusDiv.textContent = `ステータス: アップロード成功 (${fileInfo.name})`;
      console.log('Upload successful:', fileInfo);
      this.populateFileList(); // アップロード後にリストを更新
  }
}  

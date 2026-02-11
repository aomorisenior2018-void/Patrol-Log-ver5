// --- 設定 ---
// 保存先のフォルダID
const TARGET_FOLDER_ID = '1iAjnpInAjyO0cuhis_dLvDBEYK3O0GaV';

// カラム定義
// フロントエンドのデータキー(key)とスプレッドシートのヘッダー名(header)の対応表
const COLUMNS = [
  { key: 'id', header: 'ID' },
  { key: 'createdAt', header: '作成日時' },
  { key: 'inspectionDate', header: '巡回日' },
  
  // 測定値
  { key: 'pressureMpa', header: '圧力(MPa)' },
  { key: 'waterTemp', header: '水温(℃)' },
  { key: 'chlorineBefore', header: '残塩_前(mg/L)' },
  { key: 'chlorineAfter', header: '残塩_後(mg/L)' },
  { key: 'chlorineMeasured', header: '残塩_実測(mg/L)' },
  { key: 'conductivity', header: '導電率(μS/cm)' },
  { key: 'turbidity', header: '濁度(度)' },
  { key: 'color', header: '色度(度)' },
  
  // 設備状態 (既存)
  { key: 'fanStatus', header: '換気扇' },
  { key: 'tapeHeaterStatus', header: 'テープヒータ' },
  { key: 'panelHeaterStatus', header: 'パネルヒータ' },
  { key: 'roadHeaterStatus', header: 'ロードヒータ' },
  { key: 'facilityStatus', header: '施設状況' },
  
  // 機器状態 (新規追加)
  { key: 'deviceStatus', header: '機器動作確認' },
  { key: 'deviceError', header: '機器故障' },
  { key: 'observationError', header: '観測障害' },

  // 電力・備考
  { key: 'power100V', header: '100V電力' },
  { key: 'remarks', header: '備考' },
  
  // 写真1
  { key: 'photoUrl1', header: '写真URL1' },
  { key: 'photoDate1', header: '撮影日時1' },
  { key: 'photoLat1', header: '緯度1' },
  { key: 'photoLon1', header: '経度1' },
  { key: 'photoAlt1', header: '高度1' },
  
  // 写真2
  { key: 'photoUrl2', header: '写真URL2' },
  { key: 'photoDate2', header: '撮影日時2' },
  { key: 'photoLat2', header: '緯度2' },
  { key: 'photoLon2', header: '経度2' },
  { key: 'photoAlt2', header: '高度2' },

  // 写真3
  { key: 'photoUrl3', header: '写真URL3' },
  { key: 'photoDate3', header: '撮影日時3' },
  { key: 'photoLat3', header: '緯度3' },
  { key: 'photoLon3', header: '経度3' },
  { key: 'photoAlt3', header: '高度3' },

  { key: 'savedAt', header: '保存日時' }
];

/**
 * 【重要】フォルダアクセス権限の確認用関数
 * エディタ上でこの関数を選択し「実行」してください。
 * 成功すればログにフォルダ名が表示されます。
 */
function debugFolderAccess() {
  try {
    const folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
    console.log("[成功] フォルダにアクセスできました。");
    console.log("フォルダ名: " + folder.getName());
    console.log("フォルダURL: " + folder.getUrl());
    
    // テストファイル作成（確認後削除してください）
    const file = folder.createFile("test_connection.txt", "This is a test file from GAS.");
    console.log("[成功] テストファイルを作成しました: " + file.getUrl());
  } catch (e) {
    console.log("[エラー] フォルダにアクセスできませんでした。");
    console.log("エラー内容: " + e.toString());
    console.log("IDを確認してください: " + TARGET_FOLDER_ID);
  }
}

/**
 * データ保存用API (POST)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  // 30秒待機（画像処理に時間がかかる場合があるため）
  if (!lock.tryLock(30000)) {
    return createJSONOutput({ result: 'error', error: 'Server Busy' });
  }

  try {
    if (!e || !e.postData) {
      throw new Error("No postData received. (Do not run doPost manually)");
    }

    const jsonString = e.postData.contents;
    const data = JSON.parse(jsonString);
    const sheetName = data.sheetName;
    
    if (!sheetName) {
      return createJSONOutput({ result: 'error', error: 'No sheetName provided' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // ヘッダー作成ロジック
    const lastRow = sheet.getLastRow();
    
    // シートが空、またはヘッダー行がない場合の処理
    if (lastRow === 0 || sheet.getRange(1, 1).getValue() === "") {
      const headerRow = COLUMNS.map(c => c.header);
      
      // 念のため1行目に挿入
      if (lastRow > 0) sheet.insertRowBefore(1);
      
      const range = sheet.getRange(1, 1, 1, headerRow.length);
      range.setValues([headerRow]);
      range.setFontWeight("bold").setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
    } 
    // 【注意】既存シートに新しい列を追加するロジックは複雑になるため省略しています。
    // 新しい項目（機器動作確認など）を反映させるには、
    // 1. 新しいシートを作成する
    // 2. または、既存シートのヘッダー行を手動で削除して、次回送信時に再生成させる
    // 3. または、既存シートの右端に手動で列を追加する
    // のいずれかの対応が必要です。

    // 写真保存 & メタデータ展開
    if (data.photos && Array.isArray(data.photos)) {
      let folder;
      let folderError = "";

      // フォルダ取得を試みる
      try {
        folder = DriveApp.getFolderById(TARGET_FOLDER_ID);
      } catch (err) {
        folderError = "FolderAccessError: " + err.message;
        // 取得失敗時はルートフォルダを試す（データ消失防止）
        try {
          folder = DriveApp.getRootFolder();
          folderError += " (Saved to Root instead)";
        } catch (rootErr) {
          folderError += " (Root access also failed)";
        }
      }
      
      data.photos.forEach((photo, index) => {
        const suffix = index + 1;
        let url = '';

        // 画像保存またはURL維持
        if (photo.data) {
          if (!folder) {
            url = "Error: " + folderError;
          } else {
            try {
              const base64Data = photo.data.split(',')[1] || photo.data;
              const blob = Utilities.newBlob(
                Utilities.base64Decode(base64Data), 
                'image/jpeg', 
                `photo_${data.id}_${suffix}.jpg`
              );
              const file = folder.createFile(blob);
              file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              
              url = file.getUrl();
              
              // フォルダエラーがあったがルートに保存できた場合の注記
              if (folderError) {
                url += " [Note: " + folderError + "]";
              }
            } catch (err) {
              url = "FileWriteError: " + err.toString();
            }
          }
        } else if (photo.url) {
          url = photo.url;
        }
        
        data[`photoUrl${suffix}`] = url;
        
        const valOrZero = (v) => (v !== undefined && v !== null && v !== "") ? v : '0';
        data[`photoDate${suffix}`] = valOrZero(photo.date);
        data[`photoLat${suffix}`] = valOrZero(photo.lat);
        data[`photoLon${suffix}`] = valOrZero(photo.lon);
        data[`photoAlt${suffix}`] = valOrZero(photo.alt);
      });
    }

    // 行データ作成
    // COLUMNSの定義に従ってdataオブジェクトから値を抽出する
    const rowData = COLUMNS.map(col => {
      // 保存日時(サーバー時刻)
      if (col.key === 'savedAt') return new Date();
      
      // 作成日時(アプリ側時刻): Unixタイムスタンプを読みやすい形式に変換
      if (col.key === 'createdAt' && data[col.key]) {
        return Utilities.formatDate(new Date(data[col.key]), Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm");
      }

      // 値がない場合は空文字を入れる
      return data[col.key] !== undefined ? data[col.key] : '';
    });

    sheet.appendRow(rowData);

    return createJSONOutput({ result: 'success' });

  } catch (err) {
    return createJSONOutput({ result: 'error', error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * データ取得用API (GET)
 */
function doGet(e) {
  const action = e.parameter ? e.parameter.action : null;
  
  if (action === 'getSheetNames') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(sheet => sheet.getName());
    return createJSONOutput(sheetNames);
  }
  
  if (action === 'read') {
    const sheetName = e.parameter.sheetName;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) return createJSONOutput([]);
    
    const data = getData(sheet);
    return createJSONOutput(data);
  }
  
  return createJSONOutput({result: 'error', error: 'Invalid action'});
}

/**
 * シートデータ読み込み
 */
function getData(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  
  if (lastRow < 2) return [];
  
  // 1行目のヘッダーを取得
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  // 2行目以降のデータを取得
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return values.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      // ヘッダー名からキーを探す
      const colDef = COLUMNS.find(c => c.header === header);
      if (colDef) {
        if (colDef.key === 'createdAt') {
           // 作成日時はアプリ側では数値(Unix Timestamp)として扱うため、
           // シート上の文字列(yyyy/MM/dd HH:mm)を数値に戻す
           const d = new Date(row[index]);
           obj[colDef.key] = isNaN(d.getTime()) ? 0 : d.getTime();
        } else if (Object.prototype.toString.call(row[index]) === '[object Date]') {
           // その他の日付型は文字列化
           obj[colDef.key] = Utilities.formatDate(row[index], Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm:ss");
        } else {
           obj[colDef.key] = row[index];
        }
      }
    });
    
    // 写真情報復元
    const photos = [];
    [1, 2, 3].forEach(i => {
      const urlKey = `photoUrl${i}`;
      if (obj[urlKey]) {
        photos.push({
          url: obj[urlKey],
          date: obj[`photoDate${i}`],
          lat: obj[`photoLat${i}`],
          lon: obj[`photoLon${i}`],
          alt: obj[`photoAlt${i}`]
        });
      }
    });
    if (photos.length > 0) {
      obj.photos = photos;
    }
    
    return obj;
  });
}

function createJSONOutput(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
# mysqldumpFunction
mysqldumpをAWS Lambdaで実行するためのfunctionです

## 実行環境
Node.js 4.3

## 注意点
+ KMSでの復号後、復号した文字列の最初と最後をカットしています  
復号した際に ” という記号が文字列の前後についていましたため、  
応急処置で、最初と最後の文字（”）をカットするようにしています。

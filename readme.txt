* インストール
	不要, 展開のみ

* 起動
** Windows
	<firefox.exe> -app application.ini
** Linux
	xulrunner application.ini

* 使い方
	念力で把握してください ＞＜ (嘘)
	15 秒おきに TL 取得
	画面上部の入力フォームで全てを行います
	- ツイートする内容を入力して Enter
	- ":" ではじまるコマンドを入力して Enter

* コマンド (num はツイート番号)
	:fav     {num}                ふぁぼる
	:url     {num}                ツイート中の URL を取得 (短縮 URL は展開されます)
	:@       {num}                返信 (in_reply_to_status_id が付きます)
	:qt      {num}                引用してツイート (in_reply_to_status_id が付きます)
	:rt      {num}                リツイート
	:del     {num}                削除
	:men                          言及 (@自分へのツイート) 取得モード
	:user    {username}           特定ユーザのツイート取得モード
	:list    {username/listname}  リストのツイート取得モード (自分がフォローしているリストのみ)
	:f       {text}               検索モード
	:tag     {text}               フッター設定
	:tl                           mention, user, list モードから TL 取得モードに戻る
	:api                          現在の API 制限回数を取得
	:flee                         画面上のツイートをクリア (メモリが圧迫されてきたときなどに)

* 設定変更
	defaults\preferences\user.js を編集
	proxy を使う場合、書式は Mozilla Firefox のそれと同じ

* 外観の変更
	chrome\skin\xwitter.css を編集

* カスタマイズ
	chrome\content 以下のファイルを編集

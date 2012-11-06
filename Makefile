all:
	go run index.go > packages.json
	echo "var packages = `cat packages.json`;" > packages.js

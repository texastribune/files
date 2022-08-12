build:
	# Builds to /src and /docs
	npm run build || npm run doc

start:
	make -j4 watchCode watchDoc serveDoc openDoc

watchCode:
	# Builds to /src 
	npm run dev

watchDoc:
	# Builds to /docs
	npm run doc:watch

serveDoc:
	# Serves /docs
	npm run serve:doc

openDoc:
	sleep 1 # Added to let server start first.
	open http://localhost:3000/UserInterfaceTutorial.html
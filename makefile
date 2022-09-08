build:
	# Builds to /src and /docs
	npm run build || npm run doc

start:
	make -j4 watch-code watch-doc serve-doc open-doc

watch-code:
	# Builds to /src 
	npm run dev

watch-doc:
	# Builds to /docs
	npm run doc:watch

serve-doc:
	# Serves /docs
	npm run serve:doc

open-doc:
	sleep 1 # Added to let server start first.
	open http://localhost:3000/UserInterfaceTutorial.html
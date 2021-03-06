package main

import (
	"encoding/json"
	"fmt"
	"github.com/gosexy/sugar"
	"github.com/gosexy/yaml"
	"github.com/gosexy/to"
	"os"
	"sort"
)

const PS = string(os.PathSeparator)

func getPlugins() []string {
	plugins := []string{}

	dh, err := os.Open(".")
	if err != nil {
		panic(err)
	}

	files, err := dh.Readdir(-1)
	if err != nil {
		panic(err)
	}

	var pkgfile string

	for _, file := range files {
		if file.IsDir() == true {
			name := file.Name()
			pkgfile = name + PS + "package.yaml"
			_, err = os.Stat(pkgfile)
			if err == nil {
				plugins = append(plugins, name)
			}
		}
	}

	sort.Strings(plugins)

	return plugins
}

func main() {
	var response = []sugar.Tuple{}

	names := getPlugins()

	for _, name := range names {
		file := name + PS + "package.yaml"
		pkg, err := yaml.Open(file)

		if err != nil {
			panic(err)
		}

		item := sugar.Tuple{}

		keys := []string{
			"name",
			"stable",
			"latest",
			"license",
			"url",
			"demo_url",
			"description",
			"author",
			"copyright",
			"packages",
		}

		item["pkg"] = name

		for _, key := range keys {
			item[key] = pkg.Get(key)
		}

		if to.Bool(pkg.Get("hidden")) == false {
			response = append(response, item)
		}

	}

	data, _ := json.Marshal(response)

	fmt.Printf("%s", string(data))
}

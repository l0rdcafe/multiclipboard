#!/usr/bin/env node

const fs = require("fs");
const chalk = require("chalk");
const { exec, spawn } = require("child_process");

function copyToClipboard(str) {
	const process = spawn("pbcopy");
	process.stdin.write(str);
	process.stdin.end();
}

function writeKeywordValue(keyword) {
	return new Promise((resolve, reject) => {
		exec("pbpaste", (err, stdout, stderr) => {
			if (err || stderr) {
				reject(err || stderr);
			}

			if (!fs.existsSync("./data.json")) {
				fs.writeFile("./data.json", JSON.stringify({ [keyword]: stdout }), error => {
					if (error) {
						reject(error);
					}
					resolve(stdout);
				});
			}
			fs.readFile("./data.json", "utf8", (e, json) => {
				if (e) {
					reject(e);
				}

				const parsedJSON = JSON.parse(json);
				fs.writeFile("./data.json", JSON.stringify({ ...parsedJSON, [keyword]: stdout }), error => {
					if (error) {
						reject(error);
					}
					resolve(stdout);
				});
			});
		});
	});
}

function readKeywordValue(keyword) {
	return new Promise((resolve, reject) => {
		fs.readFile("./data.json", "utf8", (err, data) => {
			if (err) {
				reject(err);
			}

		  const parsedData = JSON.parse(data);
			if (parsedData[keyword]) {
				resolve(parsedData[keyword]);
			} else {
				resolve(null);
			}
		});
	});
}

function readAllKeywordsValues() {
	return new Promise((resolve, reject) => {
		fs.readFile("./data.json", "utf8", (err, data) => {
			if (err) {
				reject(err);
			}

			const parsedData = JSON.parse(data);
			const result = Object.keys(parsedData).map(key => parsedData[key]).join("\n");
			resolve(result);
		});
	});
}

async function main() {
	const args = process.argv;
	const cmd = args[2].toLowerCase();

	if (cmd === "list") {
		const values = await readAllKeywordsValues();
		await copyToClipboard(values);
		console.log(chalk.green("All keywords copied to clipboard!"));
	} else if (cmd === "save" && args.length === 4) {
		const keyword = process.argv[3];
		const data = await writeKeywordValue(keyword);
		console.log(`${chalk.green(keyword)} saved with corresponding value: ${chalk.blue(data)}`);
	} else if (args.length === 3) {
		const data = await readKeywordValue(cmd);
		const result = !data ? `No matches found for ${chalk.cyan(cmd)}.` : `The ${chalk.cyan(cmd)} keyword has a value of ${chalk.green(data)}.`;
		console.log(result);
	} else {
		console.log("Please provide a valid command or keyword.");
	}
}

main();

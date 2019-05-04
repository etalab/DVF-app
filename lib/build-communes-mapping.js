#!/usr/bin/env node
const {join} = require('path')
const {writeJson} = require('fs-extra')
const {getCodesMembres, getCommunes, getMostRecentCommune} = require('./cog')

async function main() {
  const dataset = getCommunes().reduce((acc, commune) => {
    const codesMembres = getCodesMembres(commune).filter(codeCommune => {
      const mostRecentCommune = getMostRecentCommune(codeCommune)
      return mostRecentCommune && (!mostRecentCommune.dateFin || mostRecentCommune.dateFin > '2018-01-01')
    })
    if (codesMembres.length > 1) {
      acc[commune.code] = codesMembres
    }
    return acc
  }, {})

  await writeJson(join(__dirname, '..', 'static', 'donneesgeo', 'communes-mapping.json'), dataset, {spaces: 2})
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

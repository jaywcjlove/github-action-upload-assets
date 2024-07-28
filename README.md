Release Upload Assets
===

[![Buy me a coffee](https://img.shields.io/badge/Buy%20me%20a%20coffee-048754?logo=buymeacoffee)](https://jaywcjlove.github.io/#/sponsor)
[![CI](https://github.com/jaywcjlove/github-action-upload-assets/actions/workflows/ci.yml/badge.svg)](https://github.com/jaywcjlove/github-action-upload-assets/actions/workflows/ci.yml)

GitHub Action to upload multiple assets to a release

## Example Usage

```yml
- name: Release Upload Assets
  uses: jaywcjlove/github-action-upload-assets@main
  if: steps.create_tag.outputs.successful == 'true'
  with:
    asset-path: '["./target/release/sgo-*"]'
```

Upload a file to a specified tag

```yml
- name: Release Upload Assets
  uses: jaywcjlove/github-action-upload-assets@main
  if: steps.create_tag.outputs.successful == 'true'
  with:
    tag: v0.3.0
    asset-path: '["./target/release/sgo-*"]'
```

Continue on error

```yml
- name: Release Upload Assets
  uses: jaywcjlove/github-action-upload-assets@main
  continue-on-error: true
  with:
    tag: v0.3.0
    asset-path: '["./target/release/sgo-*"]'
```

## Inputs

- `asset-path` The paths to the assets you want to upload as a JSON array. You can use a [glob](https://www.npmjs.com/package/glob) pattern.
- `tag` Specify the release tag name, for example: `v1.23.12`

## Outputs

- `browser_download_urls` The URL users can navigate to in order to download the uploaded asset

## See Also

- [Github Release Changelog Generator](https://github.com/jaywcjlove/changelog-generator) A GitHub Action that compares the commit differences between two branches
- [Create Tags From](https://github.com/jaywcjlove/create-tag-action) Auto create tags from commit or package.json.
- [Github Action Contributors](https://github.com/jaywcjlove/github-action-contributors) Github action generates dynamic image URL for contributor list to display it!
- [Generated Badges](https://github.com/jaywcjlove/generated-badges) Create a badge using GitHub Actions and GitHub Workflow CPU time (no 3rd parties servers)
- [Create Coverage Badges](https://github.com/jaywcjlove/coverage-badges-cli) Create coverage badges from coverage reports. (no 3rd parties servers)
- [Github Action package](https://github.com/jaywcjlove/github-action-package) Read and modify the contents of `package.json`.
- [Github Action EJS](https://github.com/jaywcjlove/github-action-package) A github action to render a ejs template using github context.
- [Modify File Content](https://github.com/jaywcjlove/github-action-modify-file-content) Replace text content and submit content.

## License

Licensed under the MIT License.

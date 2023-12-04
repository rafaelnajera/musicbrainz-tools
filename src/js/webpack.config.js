'use strict'

const path = require('path')
// const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    externals: {
        jquery: 'jQuery'
    },
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, '../../public/dist'),
        filename: '[name].bundle.js',
    },
    entry: {
        HomePage: './pages/HomePage.js',
        ArtistRecordingsToolPage: './pages/ArtistRecordingsToolPage.js'
    },

    devServer: {
        static: path.resolve(__dirname, '../../public/dist'),
        port: 8080,
        hot: true
    },
    // plugins: [
    //     new HtmlWebpackPlugin({ template: './src/index.html' })
    // ]
}

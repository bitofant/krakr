var webpack = require('webpack')
//var nodeExternals = require ('webpack-node-externals');
var fs = require ('fs');

var DIST_FOLDER = __dirname + '/dist/';

const frontend = {
	entry: './htdocs/index.js',
	output: {
		path: DIST_FOLDER + '/htdocs',
		publicPath: '/dist/',
		filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ],
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'style-loader',
          'css-loader',
          // {
          //   loader: 'postcss-loader', // Run post css actions
          //   options: {
          //     plugins: function () { // post css plugins, can be exported to postcss.config.js
          //       return [
          //         require('precss'),
          //         require('autoprefixer')
          //       ];
          //     }
          //   }
          // },
          'sass-loader'
        ],
      },
      {
        test: /\.sass$/,
        use: [
          'vue-style-loader',
          'css-loader',
          'sass-loader?indentedSyntax'
        ],
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            'scss': [
              'vue-style-loader',
              'css-loader',
              'sass-loader'
            ],
            'sass': [
              'vue-style-loader',
              'css-loader',
              'sass-loader?indentedSyntax'
            ]
          }
          // other vue-loader options go here
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['*', '.js', '.vue', '.json']
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    overlay: true
  },
  performance: {
    hints: false
  },
  devtool: '#eval-source-map'
}



//#################################################################



// const backend = {
//   entry: './src/app.ts',
//   target: 'node',
//   externals: [
//     nodeExternals ()
//   ],
//   output: {
//     path: DIST_FOLDER,
//     publicPath: '/dist/',
//     filename: 'bundle.js',
//     libraryTarget: 'commonjs'
//   },
//   module: {
//     rules: [
//       {
//         test: /\.tsx?$/,
//         use: 'ts-loader',
//         exclude: /node_modules/
//       }
//     ]
//   },
//   resolve: {
//     extensions: ['.tsx', '.ts', '.js', '.json']
//   }
// }



//#################################################################




function copy (file) {
  fs.copyFile (__dirname + '/' + file, DIST_FOLDER + file, err => {
    if (err) throw err;
  });
}



//#################################################################




copy ('htdocs/index.html');
copy ('htdocs/favicon.ico');


module.exports = [
  frontend,
  //backend
];


if (process.env.NODE_ENV === 'production') {
  module.exports.frontend.devtool = '#source-map'
  // http://vue-loader.vuejs.org/en/workflow/production.html
  module.exports.frontend.plugins = (module.exports.frontend.plugins || []).concat([
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ])
};



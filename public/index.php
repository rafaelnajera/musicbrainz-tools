<?php


namespace MusicBrainzTools;

use JetBrains\PhpStorm\NoReturn;
use Monolog\Handler\ErrorLogHandler;
use Monolog\Logger;
use MusicBrainzTools\Slim\Api\MusicBrainz;
use MusicBrainzTools\Slim\Controller;
use MusicBrainzTools\Slim\Site\ArtistRecToolPage;
use Slim\App;
use Slim\Psr7\Factory\ResponseFactory;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Request;
use Slim\Psr7\Response;
use Slim\Routing\RouteCollectorProxy;
use Slim\Views\Twig;
use Slim\Views\TwigMiddleware;
use ThomasInstitut\Container\MinimalContainer;
use ThomasInstitut\DataCache\DataTableDataCache;
use ThomasInstitut\DataTable\MySqlDataTable;
use ThomasInstitut\TimeString\TimeString;
use Twig\Error\LoaderError;

require '../src/php/vendor/autoload.php';
require '../etc/config.php';

global $config;

$now = TimeString::now();

$logger = new Logger('MB_Tools');
$phpLog = new ErrorLogHandler();
$logger->pushHandler($phpLog);
$request = ServerRequestFactory::createFromGlobals();
$container = new MinimalContainer();
$responseFactory = new ResponseFactory();
$app = new App($responseFactory, $container);
$app->addErrorMiddleware(true, true, true);
$router = $app->getRouteCollector()->getRouteParser();

try {
    $twig = Twig::create( "../src/twig",
        ['cache' => false]);
} catch (LoaderError $e) {
    $logger->error("Loader error exception, aborting", [ 'msg' => $e->getMessage()]);
    exitWithErrorMessage("Could not set up application, please report to administrators");
}

$app->add(new TwigMiddleware($twig, $router, $app->getBasePath()));


$dbConfig = $config['db'];

$dbh = new \PDO('mysql:dbname='. $dbConfig['db'] . ';host=' .
    $dbConfig['host'], $dbConfig['user'],
    $dbConfig['pwd']);
$dbh->query("set character set 'utf8'");
$dbh->query("set names 'utf8'");

$dataCacheDataTable = new MySqlDataTable($dbh, 'data_cache', true);
$dataCache = new DataTableDataCache($dataCacheDataTable);

$container->set('twig', $twig);
$container->set('router', $router);
$container->set('logger', $logger);
$container->set('pdo', $dbh);
$container->set('dataCache', $dataCache);


// Main routes
$app->group('', function (RouteCollectorProxy $group) use ($container){

    $group->get('/',
        function(Request $request, Response $response, array $args) use ($container){
            return Controller::simpleRender($response, $container, 'home');
        })
        ->setName('home');

    $group->get('/tool/artist/recordings[/{mbid}]',
        function(Request $request, Response $response, array $args) use ($container){
            $c = new ArtistRecToolPage($container);
            return $c->getPage($request, $response);
        })
        ->setName('tool.artist.recordings');
});

// api groups
$app->group('/api', function (RouteCollectorProxy $group) use ($container) {
    $group->get('/artist/{mbid}/data',
        function(Request $request, Response $response, array $args) use ($container){
            $c = new MusicBrainz($container);
            return $c->getArtistData($request, $response);
        })
        ->setName('api.artist.data');

    $group->get('/recording/{mbid}/data',
        function(Request $request, Response $response, array $args) use ($container){
            $c = new MusicBrainz($container);
            return $c->getRecordingData($request, $response);
        })
        ->setName('api.recording.data');

    $group->get('/work/{mbid}/data',
        function(Request $request, Response $response, array $args) use ($container){
            $c = new MusicBrainz($container);
            return $c->getWorkData($request, $response);
        })
        ->setName('api.work.data');


    $group->get('/artist/{mbid}/recordings[/{offset}]',
        function(Request $request, Response $response, array $args) use ($container){
            $c = new MusicBrainz($container);
            return $c->getRecordingsForArtist($request, $response);
        })
        ->setName('api.artist.recordings');
});

$app->run();



/**
 * Exits with an error message
 * @param string $msg
 */
#[NoReturn] function exitWithErrorMessage(string $msg): void
{
    http_response_code(503);
    print "<pre>ERROR: $msg";
    exit();
}

<?php

namespace MusicBrainzTools\Slim;

use Psr\Container\ContainerExceptionInterface;
use Psr\Container\ContainerInterface;
use Psr\Container\NotFoundExceptionInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerInterface;
use Slim\Interfaces\RouteCollectorInterface;
use Slim\Interfaces\RouteParserInterface;
use Slim\Views\Twig;
use ThomasInstitut\DataCache\DataCache;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Error\SyntaxError;

class Controller
{

    protected ContainerInterface $container;
    protected Twig $view;
    protected RouteParserInterface $router;
    protected LoggerInterface $logger;
    protected \PDO $dbh;
    protected DataCache $dataCache;


    /**
     * @throws ContainerExceptionInterface
     * @throws NotFoundExceptionInterface
     */
    public function __construct(ContainerInterface $ci)
    {
        $this->container = $ci;
        $this->view  = $ci->get('twig');
        $this->router = $ci->get('router');
        $this->logger = $ci->get('logger');
        $this->dbh = $ci->get('pdo');
        $this->dataCache = $ci->get('dataCache');



    }

    /**
     * @throws SyntaxError
     * @throws RuntimeError
     * @throws LoaderError
     */
    protected function renderTwigTemplate(ResponseInterface $response, string $template, array $data = []) : ResponseInterface {
        return $this->view->render($response, $template . '.twig', $data);
    }

    protected function responseWithJson(ResponseInterface $response, string $json, int $status = 200) : ResponseInterface {

        $response->getBody()->write($json);
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }

    protected function responseWithText(ResponseInterface $response, string $text, int $status=200) : ResponseInterface {
        $lapName = $text === '' ? 'Response ready' : 'Response with text ready';
        if ($text !== '') {
            $response->getBody()->write($text);
        }
        return $response->withStatus($status);
    }

    protected function responseWithStatus(ResponseInterface $response, int $status) : ResponseInterface{
        return $this->responseWithText($response, '', $status);
    }

    /**
     * @throws NotFoundExceptionInterface
     * @throws SyntaxError
     * @throws ContainerExceptionInterface
     * @throws RuntimeError
     * @throws LoaderError
     */
    public static function simpleRender(ResponseInterface $response, ContainerInterface $container, string $template ) : ResponseInterface {
        /** @var Twig $view */
        $view = $container->get('twig');
        /** @var LoggerInterface $logger */
        $logger = $container->get('logger');

        $logger->info("Rendering $template.twig");
        return $view->render($response, $template . '.twig');
    }

}
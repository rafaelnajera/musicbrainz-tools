<?php

namespace MusicBrainzTools\Slim\Site;

use MusicBrainzTools\Slim\Controller;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Error\SyntaxError;

class ArtistRecToolPage extends Controller
{

    /**
     * @throws SyntaxError
     * @throws RuntimeError
     * @throws LoaderError
     */
    public function getPage(ServerRequestInterface $request, ResponseInterface $response) : ResponseInterface {
        $mbid = $request->getAttribute('mbid', '');

        $this->logger->info("Artist Recording Tool Request with MBID $mbid");

        return $this->renderTwigTemplate($response, 'artist-recordings-tool', [
            'mbid' => $mbid,
         ]);
    }

}
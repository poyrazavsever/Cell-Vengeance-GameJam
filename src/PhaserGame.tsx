import { forwardRef, useEffect, useLayoutEffect, useRef } from "react";
import StartGame from "./game/main";
import { EventBus } from "./game/EventBus";
import { EVENT_KEYS } from "./game/constants/eventKeys";

export interface IRefPhaserGame
{
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps
{
    currentActiveScene?: (scene_instance: Phaser.Scene) => void
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ currentActiveScene }, ref)
{
    const game = useRef<Phaser.Game | null>(null!);

    useLayoutEffect(() =>
    {
        if (game.current === null)
        {

            game.current = StartGame("game-container");

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: null });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: null };
            }

        }

        return () =>
        {
            if (game.current)
            {
                game.current.destroy(true);
                if (game.current !== null)
                {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    useEffect(() =>
    {
        const handleSceneReady = (sceneInstance: Phaser.Scene) => {
            if (currentActiveScene && typeof currentActiveScene === "function") {
                currentActiveScene(sceneInstance);
            }

            if (typeof ref === "function") {
                ref({ game: game.current, scene: sceneInstance });
            } else if (ref) {
                ref.current = { game: game.current, scene: sceneInstance };
            }
        };

        EventBus.on(EVENT_KEYS.CURRENT_SCENE_READY, handleSceneReady);
        return () =>
        {
            EventBus.off(EVENT_KEYS.CURRENT_SCENE_READY, handleSceneReady);
        }
    }, [currentActiveScene, ref]);

    return (
        <div id="game-container"></div>
    );

});

const { ccclass } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    onLoad() {
        const physicsManager = cc.director.getPhysicsManager();
        physicsManager.enabled = true;

        // Fireboy group 1 and Watergirl group 2 should NOT collide
        physicsManager.enabledContactListener = true;
        physicsManager.collisionMatrix[1] &= ~(1 << 2);
        physicsManager.collisionMatrix[2] &= ~(1 << 1);

        cc.director.getCollisionManager().enabled = true;
    }
}
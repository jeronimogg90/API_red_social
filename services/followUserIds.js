const Follow = require("../models/follow")

const followUserIds = async (identityUserId) => {
    try {

        // Sccar info de seguimiento
        let following = await Follow.find({ "user": identityUserId })
            .select({ "followed": 1, "_id": 0 })
            .exec()

        let followers = await Follow.find({ "followed": identityUserId })
            .select({ "user": 1, "_id": 0 })
            .exec()

        // Procesar array de idtenficiadores
        let followingClean = [];
        following.forEach(follow => {
            followingClean.push(follow.followed)
        })

        let followersClean = []
        followers.forEach(follow => {
            followersClean.push(follow.user)
        })

        return {
            following: followingClean,
            followers: followersClean
        }

    } catch (error) {
        return {}
    }

}

const followThisUser = async (identityUserId, profileUserId) => {
    // Sccar info de seguimiento
    let following = await Follow.findOne({ "user": identityUserId, "followed": profileUserId })
        .select({ "followed": 1, "_id": 0 })
        .exec()

    let followers = await Follow.findOne({ "user": profileUserId, "followed" : identityUserId })
        .select({ "user": 1, "_id": 0 })
        .exec()
    
    return {
        following,
        followers
    }
}

module.exports = {
    followUserIds,
    followThisUser
}
import {
  And,
  Any,
  Collection,
  CreateRole,
  CurrentIdentity,
  CurrentToken,
  Equals,
  Exists,
  Function,
  Get,
  If,
  Index,
  Lambda,
  Let,
  Map,
  Match,
  Or,
  Paginate,
  Query,
  Select,
  Union,
  Var,
} from 'faunadb'

export default CreateRole({
  name: 'user',
  membership: [
    {
      resource: Collection('users'),
      predicate: Query(
        Lambda(
          'ref',
          Equals(
            Select(['data', 'type'], Get(CurrentToken()), false),
            'access',
          ),
        ),
      ),
    },
  ],
  privileges: [
    {
      resource: Collection('server_users'),
      actions: {
        read: Query(
          Lambda(
            'ref',
            Equals(
              Select(['data', 'userRef'], Get(Var('ref'))),
              CurrentIdentity(),
            ),
          ),
        ),
      },
    },
    {
      resource: Collection('servers'),
      actions: {
        read: Query(
          Lambda(
            'serverRef',
            Any(
              Select(
                ['data'],
                Map(
                  Paginate(
                    Match(Index('server_users_by_user'), CurrentIdentity()),
                  ),
                  Lambda(
                    'ref',
                    Equals(
                      Var('serverRef'),
                      Select(['data', 'serverRef'], Get(Var('ref'))),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      },
    },
    {
      resource: Collection('users'),
      actions: {
        read: true,
      },
    },
    {
      resource: Collection('channels'),
      actions: {
        read: Query(
          Lambda(
            'channelRef',
            Let(
              {
                subscriber1: Select(
                  ['data', 'subscriber1'],
                  Get(Var('channelRef')),
                ),
                subscriber2: Select(
                  ['data', 'subscriber2'],
                  Get(Var('channelRef')),
                ),
              },
              Or(
                Equals(CurrentIdentity(), Var('subscriber1')),
                Equals(CurrentIdentity(), Var('subscriber2')),
              ),
            ),
          ),
        ),
        write: Query((_oldData, newData) =>
          Let(
            {
              subscriber1: Select(['data', 'subscriber1'], newData),
              subscriber2: Select(['data', 'subscriber2'], newData),
            },
            Or(
              Equals(CurrentIdentity(), Var('subscriber1')),
              Equals(CurrentIdentity(), Var('subscriber2')),
            ),
          ),
        ),
        create: Query(newChannel =>
          Let(
            {
              subscriber1: Select(['data', 'subscriber1'], newChannel),
              subscriber2: Select(['data', 'subscriber2'], newChannel),
            },
            Or(
              Equals(CurrentIdentity(), Var('subscriber1')),
              Equals(CurrentIdentity(), Var('subscriber2')),
            ),
          ),
        ),
      },
    },
    {
      resource: Index('dms_by_user1'),
      actions: {
        read: Query(
          Lambda('dmRef', Equals(CurrentIdentity(), Select([0], Var('dmRef')))),
        ),
      },
    },
    {
      resource: Index('dms_by_user2'),
      actions: {
        read: Query(
          Lambda('dmRef', Equals(CurrentIdentity(), Select([0], Var('dmRef')))),
        ),
      },
    },
    {
      resource: Collection('dms'),
      actions: {
        read: Query(
          Lambda(
            'dmRef',
            Let(
              {
                user1: Select(['data', 'user1Ref'], Get(Var('dmRef'))),
                user2: Select(['data', 'user2Ref'], Get(Var('dmRef'))),
              },
              Or(
                Equals(CurrentIdentity(), Var('user1')),
                Equals(CurrentIdentity(), Var('user2')),
              ),
            ),
          ),
        ),
        create: Query(newDm =>
          Let(
            {
              dmUser: Select(['data', 'user2Ref'], newDm),
              isDmUserAFriend: Exists(
                Union(
                  Match(Index('friends_by_user1_and_user2'), [
                    CurrentIdentity(),
                    Var('dmUser'),
                  ]),
                  Match(Index('friends_by_user1_and_user2'), [
                    Var('dmUser'),
                    CurrentIdentity(),
                  ]),
                ),
              ),
            },
            Var('isDmUserAFriend'),
          ),
        ),
      },
    },
    {
      resource: Index('server_users_by_user'),
      actions: {
        read: Query(
          Lambda(
            'userAndServerRefs',
            Equals(CurrentIdentity(), Select([0], Var('userAndServerRefs'))),
          ),
        ),
      },
    },
    {
      resource: Index('messages_by_channel'),
      actions: {
        read: Query(
          Lambda(
            'terms',
            Let(
              {
                channelSubscriber1: Select(
                  ['data', 'subscriber1'],
                  Get(Select([0], Var('terms'))),
                ),
                channelSubscriber2: Select(
                  ['data', 'subscriber2'],
                  Get(Select([0], Var('terms'))),
                ),
              },
              Or(
                Equals(CurrentIdentity(), Var('channelSubscriber1')),
                Equals(CurrentIdentity(), Var('channelSubscriber2')),
              ),
            ),
          ),
        ),
      },
    },
    {
      resource: Collection('messages'),
      actions: {
        read: Query(
          Lambda(
            'message',
            Let(
              {
                channel: Get(
                  Select(['data', 'channelRef'], Get(Var('message'))),
                ),
                channelSubscriber1: Select(
                  ['data', 'subscriber1'],
                  Var('channel'),
                ),
                channelSubscriber2: Select(
                  ['data', 'subscriber2'],
                  Var('channel'),
                ),
              },
              Or(
                Equals(CurrentIdentity(), Var('channelSubscriber1')),
                Equals(CurrentIdentity(), Var('channelSubscriber2')),
              ),
            ),
          ),
        ),
        create: Query(
          Lambda(
            'newMessage',
            Let(
              {
                channel: Get(Select(['data', 'channelRef'], Var('newMessage'))),
                channelSubscriber1: Select(
                  ['data', 'subscriber1'],
                  Var('channel'),
                ),
                channelSubscriber2: Select(
                  ['data', 'subscriber2'],
                  Var('channel'),
                ),
              },
              Or(
                Equals(CurrentIdentity(), Var('channelSubscriber1')),
                Equals(CurrentIdentity(), Var('channelSubscriber2')),
              ),
            ),
          ),
        ),
      },
    },
    {
      resource: Collection('user_friends'),
      actions: {
        read: Query(ref =>
          Let(
            {
              doc: Get(ref),
              user1Ref: Select(['data', 'user1Ref'], Var('doc')),
              user2Ref: Select(['data', 'user2Ref'], Var('doc')),
            },
            Or(
              Equals(CurrentIdentity(), Var('user1Ref')),
              Equals(CurrentIdentity(), Var('user2Ref')),
            ),
          ),
        ),
        create: Query(newFriend =>
          Let(
            {
              user1Ref: Select(['data', 'user1Ref'], newFriend),
              user2Ref: Select(['data', 'user2Ref'], newFriend),
            },
            Or(
              Equals(CurrentIdentity(), Var('user1Ref')),
              Equals(CurrentIdentity(), Var('user2Ref')),
            ),
          ),
        ),
      },
    },
    {
      resource: Index('friends_by_user1'),
      actions: {
        read: Query(terms => Equals(CurrentIdentity(), Select([0], terms))),
      },
    },
    {
      resource: Index('friends_by_user2'),
      actions: {
        read: Query(terms => Equals(CurrentIdentity(), Select([0], terms))),
      },
    },
    {
      resource: Index('users_by_email'),
      actions: {
        read: true,
      },
    },
    {
      resource: Collection('user_friend_requests'),
      actions: {
        read: Query(friendRequestRef =>
          Let(
            {
              friendRequestDoc: Get(friendRequestRef),
              user: Select(['data', 'userRef'], Var('friendRequestDoc')),
              friend: Select(['data', 'friendRef'], Var('friendRequestDoc')),
            },
            Or(
              Equals(CurrentIdentity(), Var('user')),
              Equals(CurrentIdentity(), Var('friend')),
            ),
          ),
        ),
        create: Query(newFriendRequest =>
          Let(
            {
              user: Select(['data', 'userRef'], newFriendRequest),
              friend: Select(['data', 'friendRef'], newFriendRequest),
            },
            Or(
              Equals(CurrentIdentity(), Var('user')),
              Equals(CurrentIdentity(), Var('friend')),
            ),
          ),
        ),
        delete: Query(friendRequestRef =>
          Let(
            {
              friendRequestDoc: Get(friendRequestRef),
              user: Select(['data', 'userRef'], Var('friendRequestDoc')),
              friend: Select(['data', 'friendRef'], Var('friendRequestDoc')),
            },
            Or(
              Equals(CurrentIdentity(), Var('user')),
              Equals(CurrentIdentity(), Var('friend')),
            ),
          ),
        ),
      },
    },
    {
      resource: Index('friend_requests_by_friend'),
      actions: {
        read: Query(terms =>
          Let(
            {
              friendRequest: Match(
                Index('friend_requests_by_friend'),
                Select([0], terms),
              ),
            },
            If(
              Exists(Var('friendRequest')),
              Let(
                {
                  friendRequestDoc: Get(Var('friendRequest')),
                  friendRef: Select(
                    ['data', 'friendRef'],
                    Var('friendRequestDoc'),
                  ),
                },
                Equals(CurrentIdentity(), Var('friendRef')),
              ),
              true,
            ),
          ),
        ),
      },
    },
    {
      resource: Index('friend_requests_by_user'),
      actions: {
        read: Query(terms => Equals(CurrentIdentity(), Select([0], terms))),
      },
    },
    {
      resource: Index('friends_by_user1_and_user2'),
      actions: {
        read: Query(terms =>
          Let(
            {
              user1: Select([0], terms),
              user2: Select([1], terms),
            },
            Or(
              Equals(CurrentIdentity(), Var('user1')),
              Equals(CurrentIdentity(), Var('user2')),
            ),
          ),
        ),
      },
    },
    {
      resource: Index('friend_requests_by_friend_and_user'),
      actions: {
        read: Query(terms =>
          Let(
            {
              friend: Select([0], terms),
              user: Select([1], terms),
            },
            Or(
              Equals(CurrentIdentity(), Var('friend')),
              Equals(CurrentIdentity(), Var('user')),
            ),
          ),
        ),
      },
    },
    {
      resource: Index('dms_by_channel'),
      actions: {
        read: Query(terms =>
          Let(
            {
              channel: Get(Select([0], terms)),
              channelSubscriber1: Select(
                ['data', 'subscriber1'],
                Var('channel'),
              ),
              channelSubscriber2: Select(
                ['data', 'subscriber2'],
                Var('channel'),
              ),
            },
            Or(
              Equals(CurrentIdentity(), Var('channelSubscriber1')),
              Equals(CurrentIdentity(), Var('channelSubscriber2')),
            ),
          ),
        ),
      },
    },
    {
      resource: Index('channels_by_subscriber1_and_subscriber2'),
      actions: {
        read: Query(terms =>
          Let(
            {
              subscriber1: Select([0], terms),
              subscriber2: Select([1], terms),
            },
            Or(
              Equals(CurrentIdentity(), Var('subscriber1')),
              Equals(CurrentIdentity(), Var('subscriber2')),
            ),
          ),
        ),
      },
    },
  ],
})

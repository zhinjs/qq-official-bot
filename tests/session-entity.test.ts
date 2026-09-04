import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Group } from '@/entries/group'
import { User } from '@/entries/user'
import { Channel } from '@/entries/channel'
import { MessageService } from '@/services/message'
import { GroupService } from '@/services/group'
import { FileProcessor } from '@/message'
import type { Bot } from '@/bot'
import { createFakeRequest } from './fake-http'

function createGroup(id: string) {
    const fake = createFakeRequest((call) => {
        if (call.url.endsWith('/messages')) return { data: { id: 'mid-1' } }
        return { data: {} }
    })
    const fileProcessor = new FileProcessor(fake.request)
    const bot = {
        messageService: new MessageService(fake.request, 'app-id', fileProcessor),
        fileProcessor,
        groupService: new GroupService(fake.request),
        menuPanelService: {
            createCommandPanel: async (options: unknown) => options,
            updateCommandPanelTargets: async (panelId: string, options: unknown) => ({ panelId, options }),
            getCommandPanels: async (options: unknown) => options,
        },
    } as unknown as Bot
    return { group: new Group(bot, id), calls: fake.calls }
}

test('Group.send binds the entity id into the group messages path', async () => {
    const { group, calls } = createGroup('bound-group')
    await group.send('hello')
    assert.equal(calls[0].url, '/v2/groups/bound-group/messages')
})

test('Group.mute binds the entity id into restrict_chat_setting', async () => {
    const { group, calls } = createGroup('bound-group')
    await group.mute('member-openid', '2026-08-12T12:00:00+08:00')
    assert.equal(calls[0].url, '/v2/groups/bound-group/restrict_chat_setting')
    assert.deepEqual(calls[0].data, {
        members: [{
            op: 'add',
            member_openid: 'member-openid',
            mute_expire_at: '2026-08-12T12:00:00+08:00',
        }],
    })
})

test('Group member management binds the entity id into official paths', async () => {
    const { group, calls } = createGroup('bound-group')

    await group.membersPage({ cursor: 'next-page' })
    await group.member('member-openid')
    await group.removeMembers({ member_openids: ['member-openid'] })
    await group.blockMembers(['member-openid'])

    assert.deepEqual(calls.map(call => call.url), [
        '/v2/groups/bound-group/members',
        '/v2/groups/bound-group/members/member-openid',
        '/v2/groups/bound-group/batch_remove_members',
        '/v2/groups/bound-group/member_blacklist',
    ])
    assert.deepEqual(calls[0].params, { cursor: 'next-page' })
    assert.deepEqual(calls[3].data, { op: 'add', member_openids: ['member-openid'] })
})

test('Group.createPanel binds the entity id as group_openids', async () => {
    const { group } = createGroup('bound-group')
    const created = await group.createPanel({ items: [] })
    assert.deepEqual(created, {
        scope: 'group',
        panel: { items: [] },
        target_type: 'specific',
        group_openids: ['bound-group'],
    })
})

test('User.send binds the entity id into the user messages path', async () => {
    const fake = createFakeRequest(() => ({ data: { id: 'mid-u' } }))
    const fileProcessor = new FileProcessor(fake.request)
    const user = new User({
        messageService: new MessageService(fake.request, 'app-id', fileProcessor),
        fileProcessor,
        menuPanelService: {},
    } as unknown as Bot, 'bound-user')
    await user.send('hi')
    assert.equal(fake.calls[0].url, '/v2/users/bound-user/messages')
})

test('Channel.send binds the entity id into the channel messages path', async () => {
    const fake = createFakeRequest(() => ({ data: { id: 'mid-c' } }))
    const fileProcessor = new FileProcessor(fake.request)
    const channel = new Channel({
        messageService: new MessageService(fake.request, 'app-id', fileProcessor),
        fileProcessor,
        channelService: {},
        permissionService: {},
        reactionService: {},
        scheduleService: {},
        audioService: {},
        threadService: {},
        menuPanelService: {},
    } as unknown as Bot, 'bound-channel')
    await channel.send('hi')
    assert.equal(fake.calls[0].url, '/channels/bound-channel/messages')
})

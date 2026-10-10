package com.school.dolphin.attendance.dto;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.function.BinaryOperator;

class TrieNode{
    ArrayList<TrieNode> children;
    Boolean isEndOfWord;
    String word;
    TrieNode(){
        children = new ArrayList<>(Collections.nCopies(26, null));
        isEndOfWord = false;
        word = null;
    }
    void insert(Character ch){
        int index = ch - 'a';
        if(children.get(index) == null){
            children.set(index, new TrieNode());
        }
    }
    void markEnd(){
        isEndOfWord = true;
    }
    void setWord(String s){
        word = s;
    }
    TrieNode getNext(Character ch){
        int index = ch - 'a';
        return children.get(index);
    }

    ArrayList<String> getAllChild(){
        ArrayList<String> ans = new ArrayList<>();
        for(TrieNode child: children){
            if(child!=null){
                ArrayList<String> childWords = child.getAllChild();
                ans.addAll(childWords);
            }
        }
        if(isEndOfWord) ans.add(word);
        return ans;
    }
}

public class Solution {

    static ArrayList<ArrayList<String>> displayContacts(String contact[], String s) {
        // code here
        TrieNode head = new TrieNode();
        ArrayList<ArrayList<String>> ans = new ArrayList<>();

        for(String str: contact){
            TrieNode node = head;
            for(int i=0;i<str.length();i++){
                node.insert(str.charAt(i));
                node = node.getNext(str.charAt(i));
            }
            node.markEnd();
            node.setWord(str);
        }

        TrieNode node = head;
        for(int i=0;i<s.length();i++){
            node = node.getNext(s.charAt(i));
            if(node==null){
                ans.add(new ArrayList<>(List.of("0")));
                continue;
            }
            ArrayList<String> wordList = node.getAllChild();
            Collections.sort(wordList);
            ans.add(wordList);
        }

        return ans;
    }
}
